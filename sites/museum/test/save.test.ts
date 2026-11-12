import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GAME_IDS } from '../src/lib/games.ts';
import {
	blank,
	cookieName,
	decode,
	encode,
	gameSave,
	idHash,
	type GameOption
} from '../src/lib/shared/save.ts';
import { loadLevels } from './levels.ts';

const ids = (n: number, prefix = 'level') => Array.from({ length: n }, (_, i) => `${prefix}-${i}`);

function fakeCookies() {
	const jar = new Map<string, string>();
	const doc = {
		get cookie() {
			return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
		},
		set cookie(line: string) {
			const pair = line.split(';')[0];
			const at = pair.indexOf('=');
			jar.set(pair.slice(0, at), pair.slice(at + 1));
		}
	};
	Object.defineProperty(globalThis, 'document', { value: doc, configurable: true });
	return jar;
}

test('every game level id has its own hash', () => {
	for (const game of GAME_IDS) {
		const seen = new Map<string, string>();
		for (const { id } of loadLevels(game)) {
			const h = idHash(id);
			assert.ok(!seen.has(h), `${game}: "${id}" and "${seen.get(h)}" share the hash ${h}`);
			seen.set(h, id);
		}
	}
});

test('a save survives encode and decode', () => {
	const all = ids(30);
	const save = {
		level: 17,
		completed: { 'level-0': true, 'level-5': true, 'level-29': true },
		muted: true,
		options: { relaxed: true, other: false }
	};
	assert.deepEqual(decode(encode(save, all), all), save);
	assert.deepEqual(decode(encode(blank(), all), all), blank());
});

test('✓ marks and the saved level stay on their pictures when a level is added in front', () => {
	const before = ids(10);
	const value = encode(
		{ level: 4, completed: { 'level-2': true, 'level-7': true }, muted: false, options: {} },
		before
	);
	const after = ['new-first', ...before.slice(0, 5), 'new-middle', ...before.slice(5)];
	const save = decode(value, after);
	assert.deepEqual(save.completed, { 'level-2': true, 'level-7': true });
	assert.equal(after[save.level], 'level-4');
});

test('a broken cookie reads as a fresh start', () => {
	const all = ids(5);
	for (const bad of ['', 'garbage', 'l=%%%&d=@@@@', 'l=9999&d=zzzz']) {
		assert.deepEqual(decode(bad, all), blank(), bad);
	}
	const jar = fakeCookies();
	const { loadSave } = gameSave('test', () => all.map((id) => ({ id })));
	jar.set(cookieName('test'), '%E0%A4%A');
	assert.deepEqual(loadSave(), blank());
});

test('update keeps levels finished in another tab', () => {
	const levels = ids(10).map((id) => ({ id }));
	const jar = fakeCookies();
	const tabA = gameSave('test', () => levels);
	const tabB = gameSave('test', () => levels);

	const stale = tabA.loadSave();
	tabB.update((s) => {
		s.completed['level-1'] = true;
		s.completed['level-2'] = true;
		s.level = 3;
	});

	tabA.update((s) => {
		s.options.relaxed = true;
	});
	let now = tabA.loadSave();
	assert.deepEqual(now.completed, { 'level-1': true, 'level-2': true });
	assert.equal(now.level, 3);
	assert.equal(now.options.relaxed, true);

	const written = tabA.update(() => ({ ...stale, completed: { 'level-5': true }, level: 5 }));
	now = tabA.loadSave();
	assert.deepEqual(now, written);
	assert.deepEqual(now.completed, { 'level-1': true, 'level-2': true, 'level-5': true });
	assert.equal(now.level, 5);

	tabA.persist(blank());
	assert.deepEqual(tabA.loadSave(), blank());
	assert.ok(jar.has(cookieName('test')));
});

test('the cookie stays under 1KB with 200 finished levels', () => {
	const all = ids(200, 'some-fairly-long-level-id');
	const completed = Object.fromEntries(all.map((id) => [id, true]));
	const save = { level: 199, completed, muted: true, options: { relaxed: true } };
	const jar = fakeCookies();
	gameSave('mosaic', () => all.map((id) => ({ id }))).persist(save);
	const stored = jar.get(cookieName('mosaic'))!;
	assert.ok(stored.length < 1024, `cookie value is ${stored.length} characters`);
	assert.deepEqual(decode(decodeURIComponent(stored), all), save);
});

test('options read as their defaults until set, and an off option stays off', () => {
	const levels = ids(3).map((id) => ({ id }));
	const options: GameOption[] = [
		{ key: 'relaxed', label: 'relaxed' },
		{ key: 'hints', label: 'on by default', default: true }
	];
	const jar = fakeCookies();
	const g = gameSave('opts', () => levels, options);
	assert.deepEqual(g.blank().options, { relaxed: false, hints: true });
	assert.deepEqual(g.loadSave().options, { relaxed: false, hints: true }, 'no cookie');

	g.update((s) => {
		s.options.relaxed = true;
		s.options.hints = false;
	});
	const value = decodeURIComponent(jar.get(cookieName('opts'))!);
	assert.match(value, /(^|&)o=relaxed\.-hints(&|$)/, value);
	assert.deepEqual(g.loadSave().options, { relaxed: true, hints: false });
	assert.deepEqual(g.saveFromCookie(value).options, { relaxed: true, hints: false });

	assert.deepEqual(g.saveFromCookie('l=&d=&m=0&o=relaxed').options, { relaxed: true, hints: true });
	assert.doesNotMatch(encode(blank(), ids(1)), /o=/);
	assert.throws(() => gameSave('bad', () => levels, [{ key: 'a.b', label: '' }]));
	assert.deepEqual(decode('o=ok.-%21%21.-', ids(1)).options, { ok: true });
});
