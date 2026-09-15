import {parseAgentAction,withoutAction} from '../src/services/agentActions';
test('accepts only supported action proposals',()=>{
  expect(parseAgentAction('<ACTION>{"type":"maps","query":"Mumbai"}</ACTION>')).toEqual({type:'maps',query:'Mumbai'});
  expect(parseAgentAction('<ACTION>{"type":"shell","command":"anything"}</ACTION>')).toBeNull();expect(parseAgentAction('<ACTION>{"type":"maps","query":""}</ACTION>')).toBeNull();
});
test('requires unambiguous calendar dates',()=>{
  expect(parseAgentAction('<ACTION>{"type":"calendar","title":"Review","start":"tomorrow","end":"later"}</ACTION>')).toBeNull();
  expect(parseAgentAction('<ACTION>{"type":"calendar","title":"Review","start":"2026-09-10T15:00:00+05:30","end":"2026-09-10T15:30:00+05:30"}</ACTION>')?.type).toBe('calendar');
});
test('hides partial structured proposals',()=>{expect(withoutAction('Draft ready <ACTION>{"type":')).toBe('Draft ready');});
