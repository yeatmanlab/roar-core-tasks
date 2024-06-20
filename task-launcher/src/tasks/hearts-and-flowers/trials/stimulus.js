import jsPsychHTMLMultiResponse from '@jspsych-contrib/plugin-html-multi-response';
import { mediaAssets } from '../../..';
import { jsPsych, isTouchScreen } from '../../taskSetup';
import {
  StimulusType,
  StimulusSideType,
  ResponseSideType,
  InputKey,
  getCorrectInputSide,
  getStimulusLayout,
} from '../helpers/utils';
import store from 'store2';
import shuffle from 'lodash/shuffle';
import { finishExperiment } from '../../shared/trials';

/**
 *TODO: we should perhaps allow {@link https://www.jspsych.org/7.2/overview/media-preloading/#automatic-preloading automatic preload}
  of the stimulus image and modify the DOM nodes that jsPsych creates in on_load?
  */
const numIncorrect = store.page.namespace('numIncorrect', 0);

export function stimulus(isPractice, stage, stimulusDuration, onTrialFinishTimelineCallback = undefined) {
  return {
    type: jsPsychHTMLMultiResponse,
    data: () => {
      return {
        // not camelCase because firekit
        save_trial: true,
        assessment_stage: stage,
        // not for firekit
        isPracticeTrial: isPractice,
      };
    },
    stimulus: () => {
      return getStimulusLayout(
        mediaAssets.images[jsPsych.timelineVariable('stimulus')],
        jsPsych.timelineVariable('position') <= 0.5,
      );
    },
    //TODO: apply stimulusDuration but only on the heart or flower, the stimulus container should remain visible.
    // stimulus_duration: stimulusDuration,
    on_load: () => {
      // document.getElementById('jspsych-html-multi-response-btngroup').classList.add('btn-layout-hf');
      document.getElementById('jspsych-html-multi-response-stimulus').classList.add('haf-parent-container');
      document.getElementById('jspsych-html-multi-response-btngroup').classList.add('haf-parent-container');
      document.getElementById('jspsych-html-multi-response-btngroup').classList.add('lev-response-row');
      document.getElementById('jspsych-html-multi-response-btngroup').classList.add('linear-4');
    },
    button_choices: [StimulusSideType.Left, StimulusSideType.Right],
    keyboard_choices: isTouchScreen ? InputKey.NoKeys : [InputKey.ArrowLeft, InputKey.ArrowRight],
    button_html: [
      `
    <div class='response-container--small'>
      <button class='secondary--green'></button>
    </div>`,
      `<div class='response-container--small'>
      <button class='secondary--green'></button>
    </div>`,
    ],
    //TODO: save whether answer is correct/incorrect to fix practice feedback
    //TODO: check data is saved properly
    on_finish: (data) => {
      const stimulusPosition = jsPsych.timelineVariable('position');
      const stimulusType = jsPsych.timelineVariable('stimulus');

      // get response position
      let response;
      if (data.button_response === 0 || data.button_response === 1) {
        response = data.button_response;
      } else if (data.keyboard_response === InputKey.ArrowLeft || data.keyboard_response === InputKey.ArrowRight) {
        response = data.keyboard_response === InputKey.ArrowLeft ? 0 : 1;
      } else {
        const errorMessage = `Invalid response: ${data.button_response} or ${data.keyboard_response} in ${data}`;
        console.error(errorMessage);
      }

      // get stimulus side
      let stimuluSide;
      if (stimulusPosition === 0) {
        stimuluSide = StimulusSideType.Left;
      } else if (stimulusPosition === 1) {
        stimuluSide = StimulusSideType.Right;
      } else {
        const errorMessage = `Invalid stimuluSide: ${data.button_response} or ${data.keyboard_response} in ${data}`;
        console.error(errorMessage);
      }

      // record whether answer was correct or not
      const validAnswer = getCorrectInputSide(stimulusType, stimuluSide);
      data.correct = validAnswer === response;

      if (!isPractice) {
        if (!data.correct) {
          numIncorrect.transact('numIncorrect', (oldVal) => oldVal + 1);

          console.log('numIncorrect: ', numIncorrect('numIncorrect'));
        } else {
          numIncorrect('numIncorrect', 0);
        }
      }

      const maxIncorrect = store.session.get('config').maxIncorrect;

      if (numIncorrect('numIncorrect') == maxIncorrect) {
        finishExperiment();
      }

      //TODO: move these to timeline-level callback/variables
      store.session.set('correct', data.correct);
      store.session.set('stimulus', stimulusType);
      store.session.set('side', stimuluSide);

      jsPsych.data.addDataToLastTrial({
        item: stimulusType,
        answer: validAnswer === 0 ? ResponseSideType.Left : ResponseSideType.Right,
        response: response === 0 ? ResponseSideType.Left : ResponseSideType.Right,
      });

      if (onTrialFinishTimelineCallback) {
        onTrialFinishTimelineCallback(data);
      }
    },

    // DEFAULTS
    // trial_duration: null,
    // response_ends_trial: true,
  };
}

const randomPosition = () => Math.round(Math.random());

/**
 * Builds timeline_variables property to be used along with our "stimulus".
 * From specs: "To maintain balance between right/left stimulus presentation and prevent long sequences,
 * repetitive sequences using only one side, we grouped trials into sets of 4.
 * Within each set, 2 trials are randomly assigned to each side.""
 * @param {*} trialCount
 * @param {*} stimulusType StimulusType.Heart or StimulusType.Flower
 */
export function buildHeartsOrFlowersTimelineVariables(trialCount, stimulusType) {
  if (stimulusType !== StimulusType.Heart && stimulusType !== StimulusType.Flower) {
    const errorMessage = `Invalid stimulusType: ${stimulusType} for buildSubtimelineVariables()`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  const jsPsychTimelineVariablesArray = [];
  const setsOfFourCount = Math.floor(trialCount / 4);
  for (let i = 0; i < setsOfFourCount; i++) {
    jsPsychTimelineVariablesArray.push({ stimulus: stimulusType, position: 0 });
    jsPsychTimelineVariablesArray.push({ stimulus: stimulusType, position: 1 });
    jsPsychTimelineVariablesArray.push({ stimulus: stimulusType, position: randomPosition() });
    jsPsychTimelineVariablesArray.push({ stimulus: stimulusType, position: randomPosition() });
  }
  const remainderCount = trialCount % 4;
  if (remainderCount >= 1) {
    jsPsychTimelineVariablesArray.push({ stimulus: stimulusType, position: 0 });
  }
  if (remainderCount >= 2) {
    jsPsychTimelineVariablesArray.push({ stimulus: stimulusType, position: 1 });
  }
  if (remainderCount >= 3) {
    jsPsychTimelineVariablesArray.push({ stimulus: stimulusType, position: randomPosition() });
  }
  return jsPsychTimelineVariablesArray;
}

export function buildMixedTimelineVariables(trialCount) {
  const heartLeft = { stimulus: StimulusType.Heart, position: 0 };
  const heartRight = { stimulus: StimulusType.Heart, position: 1 };
  const flowerLeft = { stimulus: StimulusType.Flower, position: 0 };
  const flowerRight = { stimulus: StimulusType.Flower, position: 1 };
  const optionsToRandomize = [heartLeft, heartRight, flowerLeft, flowerRight];

  const jsPsychTimelineVariablesArray = [];
  let sequence = [];
  for (let i = 0; i < trialCount; i++) {
    if (sequence.length === 0) {
      sequence = shuffle(optionsToRandomize);
    }
    jsPsychTimelineVariablesArray.push(sequence.pop());
  }
  return jsPsychTimelineVariablesArray;
}
