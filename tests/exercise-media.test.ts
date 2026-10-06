import test from 'node:test';
import assert from 'node:assert/strict';
import { privateExercisePath } from '../lib/exercise-media';
import media from '../data/media.json';
import exercises from '../data/exercises.json';

test('private exercise URLs are confined to the licensed bucket and numeric MP4 IDs', () => {
  assert.equal(privateExercisePath('supabase://exercise-media/0042.mp4'),'0042.mp4');
  for (const value of ['supabase://progress/0042.mp4','supabase://exercise-media/../0042.mp4','supabase://exercise-media/0042.mp4?token=x','https://example.com/0042.mp4']) assert.equal(privateExercisePath(value),null);
});
test('enabled video mappings reference known exercises and safe storage objects', () => {
 const ids = new Set(exercises.map(e => e.id));
 assert.equal(Object.keys(media).length,101);
 for (const [id, entry] of Object.entries(media)) {assert.ok(ids.has(id));assert.ok(privateExercisePath(entry.url));}
 for(const rejected of ['E014','E091','E092']) assert.ok(!(rejected in media));
});
