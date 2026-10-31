import { describe,it,expect } from 'vitest';
import { matchExam,normalizeExam } from './exam';
import { completeExam,regionFromNumber,validateEntry } from './schema';
import { selectFemaleVoice } from './audio';
import { MAX_EXAM_SECONDS,encodeWav } from './record-exam';

describe('whole-exam rules',()=>{
 it('maps numbers 1–6 left and 7–12 right',()=>{expect(regionFromNumber(1)).toEqual({breast:'left',zone:'upper_outer'});expect(regionFromNumber(8)).toEqual({breast:'right',zone:'upper_inner'});expect(regionFromNumber(12)).toEqual({breast:'right',zone:'armpit'});expect(regionFromNumber(13)).toBeNull();});
 it('creates 14 unmentioned defaults without asking about pain',()=>{const r=completeExam([]);expect(r).toHaveLength(14);expect(r.every(e=>e.pain==='no'&&e.no_changes&&!e.mentioned&&e.source==='default')).toBe(true);});
 it('extracts all numbered findings and preserves null pain',()=>{const r=matchExam('Number 1 is hard since last week. Number 11 has discharge.','en');const mentioned=r.entries.filter(e=>e.mentioned);expect(mentioned.map(e=>e.region_number)).toEqual([1,11]);expect(mentioned[0]?.changes[0]).toEqual({type:'hardening',since_when:'since last week'});expect(mentioned[1]?.pain).toBeNull();});
 it('splits new locations in one spoken sentence',()=>{const r=matchExam('Number 1 is hard and number 11 has discharge','en');expect(r.entries.filter(e=>e.mentioned).map(e=>e.region_number)).toEqual([1,11]);});
 it('does not guess a location for a lump',()=>{const r=matchExam('I have a lump','en');expect(r.unresolved).toHaveLength(1);expect(r.unresolved[0]?.breast).toBeNull();expect(r.entries.some(e=>e.mentioned)).toBe(false);});
 it('splits both breasts into separate entries',()=>{const r=matchExam('Both nipples have discharge','en');expect(r.entries.filter(e=>e.mentioned).map(e=>e.breast)).toEqual(['left','right']);});
 it('distinguishes sore skin from pain',()=>{const r=matchExam('Number 1 has a sore on the skin. Number 8 is sore.','en');const entries=r.entries.filter(e=>e.mentioned);expect(entries[0]?.changes.map(c=>c.type)).toContain('skin_erosion');expect(entries[0]?.pain).toBeNull();expect(entries[1]?.pain).toBe('yes');});
 it('keeps invalid changes in the note when assigning location',()=>{const r=normalizeExam({findings:[{breast:null,region:null,pain:null,changes:['discharge'],note:'liquid',since_when:'since yesterday',location_unclear:true}],general_note:'',asked_a_question:false},'liquid');const e=validateEntry(r.unresolved[0],{breast:'left',zone:'armpit'});expect(e.changes).toEqual([]);expect(e.note).toContain('discharge');});
 it('only allows known female browser voices',()=>{expect(selectFemaleVoice([{name:'Unknown',lang:'en-US'},{name:'Daniel',lang:'en-GB'}],'en')).toBeNull();expect(selectFemaleVoice([{name:'Samantha',lang:'en-US'}],'en')?.name).toBe('Samantha');expect(selectFemaleVoice([{name:'Samantha',lang:'de-DE'}],'en')).toBeNull();});
 it('stops at five minutes and encodes a complete audio file',async()=>{expect(MAX_EXAM_SECONDS).toBe(300);const blob=encodeWav([new Float32Array([0,0.5,-0.5])],24000);expect(blob.type).toBe('audio/wav');expect(blob.size).toBe(50);});
});

