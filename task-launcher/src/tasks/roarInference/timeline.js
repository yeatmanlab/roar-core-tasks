import 'regenerator-runtime/runtime';
import store from 'store2';
// setup
import { initTrialSaving, initTimeline } from '../shared/helpers';
import { jsPsych, initializeCat } from '../taskSetup';
// trials
import { afcStimulus, exitFullscreen, setupStimulus, taskFinished } from '../shared/trials';

export default function buildRoarInferenceimeline(config, mediaAssets) {
  initTrialSaving(config);
  const initialTimeline = initTimeline(config);

  // does not matter if trial has properties that don't belong to that type
  const trialConfig = {
    trialType: 'audio',
    responseAllowed: true,
    promptAboveButtons: true,
    task: config.task,
  };

  const stimulusBlock = {
    timeline: [afcStimulus(trialConfig)],
    conditional_function: () => {
      if (store.session.get('skipCurrentTrial')) {
        store.session.set('skipCurrentTrial', false);
        return false;
      }
      return true;
    },
  };

  const timeline = [initialTimeline];

  const numOfTrials = store.session.get('totalTrials');
  for (let i = 0; i < numOfTrials; i++) {
    timeline.push(setupStimulus);
    timeline.push(stimulusBlock);
  }

  initializeCat();

  // final screens
  timeline.push(taskFinished);
  timeline.push(exitFullscreen);

  return { jsPsych, timeline };
}
