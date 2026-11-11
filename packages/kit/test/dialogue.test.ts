import { describe, expect, it } from 'vitest';
import {
  advanceDialogue,
  canAdvance,
  currentReader,
  type DialogueScene,
  nextReader,
  readerRoleOf,
  readLines,
  startDialogue,
  tapIntent,
  toggleSkip,
} from '../src/dialogue';

const roles = ['alice', 'bob'];
const scene: DialogueScene = {
  id: 'opening',
  narratorRoleId: 'alice',
  npcReaderRoleId: 'bob',
  lines: [
    { text: '雨の夜、 洋館に二人が集まった。' },
    { speaker: 'alice', text: 'ひどい雨ね。' },
    { speaker: 'butler', text: 'ようこそお越しくださいました。' },
    { speaker: 'bob', text: '主人はどこに？' },
  ],
};

describe('readerRoleOf', () => {
  it('地の文は narrator、 役の台詞はその役、 NPC は npcReader', () => {
    expect(scene.lines.map((l) => readerRoleOf(scene, l, roles))).toEqual([
      'alice',
      'alice',
      'bob',
      'bob',
    ]);
  });
  it('npcReader が無ければ NPC は narrator が読む', () => {
    const s = { ...scene, npcReaderRoleId: undefined };
    expect(readerRoleOf(s, { speaker: 'butler', text: '' }, roles)).toBe('alice');
  });
});

describe('advanceDialogue', () => {
  it('担当だけが送れ、 最後の行で finished になる', () => {
    const p = startDialogue(scene);
    expect(() => advanceDialogue(scene, p, 'bob', roles)).toThrow();
    advanceDialogue(scene, p, 'alice', roles);
    advanceDialogue(scene, p, 'alice', roles);
    expect(currentReader(scene, p, roles)).toBe('bob');
    expect(canAdvance(scene, p, 'alice', roles)).toBe(false);
    advanceDialogue(scene, p, 'bob', roles);
    advanceDialogue(scene, p, 'bob', roles);
    expect(p.finished).toBe(true);
    expect(currentReader(scene, p, roles)).toBeNull();
    expect(() => advanceDialogue(scene, p, 'bob', roles)).toThrow();
  });
  it('expectedIndex が合わない二重タップを弾く', () => {
    const p = startDialogue(scene);
    advanceDialogue(scene, p, 'alice', roles, 0);
    expect(() => advanceDialogue(scene, p, 'alice', roles, 0)).toThrow();
    expect(p.index).toBe(1);
  });
  it('配役の無い席 (観測者) は送れない', () => {
    const p = startDialogue(scene);
    expect(() => advanceDialogue(scene, p, undefined, roles)).toThrow();
  });
});

describe('nextReader / readLines', () => {
  it('次の担当を先に返し、 先の行は見せない', () => {
    const p = startDialogue(scene);
    p.index = 1;
    expect(nextReader(scene, p, roles)).toBe('bob');
    expect(readLines(scene, p)).toHaveLength(2);
    p.index = 3;
    expect(nextReader(scene, p, roles)).toBeNull();
    p.finished = true;
    expect(readLines(scene, p)).toHaveLength(4);
  });
});

describe('toggleSkip', () => {
  it('全員の同意で読み飛ばし、 もう一度押すと取り消せる', () => {
    const p = startDialogue(scene);
    expect(toggleSkip(p, 'seat-1', ['seat-1', 'seat-2'])).toBe(false);
    expect(toggleSkip(p, 'seat-1', ['seat-1', 'seat-2'])).toBe(false);
    expect(p.skipAgreed).toEqual([]);
    toggleSkip(p, 'seat-1', ['seat-1', 'seat-2']);
    expect(toggleSkip(p, 'seat-2', ['seat-1', 'seat-2'])).toBe(true);
    expect(p.finished).toBe(true);
  });
  it('プレイヤー以外は同意できない', () => {
    const p = startDialogue(scene);
    expect(() => toggleSkip(p, 'admin', ['seat-1'])).toThrow();
  });
});

describe('tapIntent', () => {
  it('1 回目は全文表示、 2 回目は担当だけ送る', () => {
    expect(tapIntent({ fullyShown: false, isReader: false, finished: false })).toBe('reveal');
    expect(tapIntent({ fullyShown: true, isReader: true, finished: false })).toBe('advance');
    expect(tapIntent({ fullyShown: true, isReader: false, finished: false })).toBe('wait');
    expect(tapIntent({ fullyShown: true, isReader: true, finished: true })).toBe('done');
  });
});
