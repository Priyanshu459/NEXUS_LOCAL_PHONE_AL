import {createReplyUpdates} from '../src/services/replyUpdates';

beforeEach(()=>jest.useFakeTimers());
afterEach(()=>jest.useRealTimers());
test('one hundred incoming tokens cause one update containing the latest full text',()=>{
  let text=''; const publish=jest.fn(()=>text);
  const updates=createReplyUpdates(publish);
  for(let n=0;n<100;n++){text+='x';updates.schedule();}
  expect(publish).not.toHaveBeenCalled();
  jest.advanceTimersByTime(80);
  expect(publish).toHaveBeenCalledTimes(1);
  expect(publish.mock.results[0].value).toHaveLength(100);
  text+='done';updates.schedule();jest.advanceTimersByTime(80);
  expect(publish.mock.results[1].value).toBe('x'.repeat(100)+'done');
});
test('completion or cancellation discards pending UI callbacks',()=>{
  const publish=jest.fn();const updates=createReplyUpdates(publish);
  updates.schedule();updates.dispose();updates.schedule();jest.runAllTimers();
  expect(publish).not.toHaveBeenCalled();
});
