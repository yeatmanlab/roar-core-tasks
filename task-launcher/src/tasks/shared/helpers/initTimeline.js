import { enterFullscreen } from '../trials';
import { makePid } from './makePID';
import { startAppTimer } from './index';
import store from 'store2';

export const initTimeline = (config) => {
  const initialTimeline = [enterFullscreen];

  const beginningTimeline = {
    timeline: initialTimeline,
    on_timeline_finish: async () => {
      config.pid = store.session('pid') || makePid();
      await config.firekit.updateUser({
        assessmentPid: config.pid,
        ...config.userMetadata,
      });

      startAppTimer();
    },
  };

  return beginningTimeline;
};
