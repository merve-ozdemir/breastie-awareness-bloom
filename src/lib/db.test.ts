import { it,expect } from 'vitest';
import { saveSession } from './db';
import { completeExam } from './schema';
it('refuses persistence before the user confirms the check',async()=>{
 await expect(saveSession({id:'draft',check_date:'2026-10-31',cycle_day:null,language:'en',entries:completeExam([]),general_note:'',confirmed:false})).rejects.toThrow('unconfirmed');
});
