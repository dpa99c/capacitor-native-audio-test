<script setup lang="ts">
import {onMounted, Ref, ref, UnwrapRef} from "vue";
import {IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonCheckbox, IonRange, IonSelect, IonSelectOption} from '@ionic/vue';

import {Capacitor} from "@capacitor/core";
import {AssetPlayOptions, NativeAudio} from "../../../capacitor-native-audio";

// Data
const selectedSound = ref();
const selectedSoundDurationSecs:Ref<UnwrapRef<number>> = ref(0);

const shouldFadeIn = ref(false);
const fadeInDuration = ref(1);

const shouldFadeOut = ref(false);
const fadeOutDuration = ref(1);
const fadeOutStartTime = ref(0);

const loop = ref(false);
const volume = ref(1);
const volumeChangeDuration = ref(0);
const time = ref(0);
const startDelay = ref(0);

const isPlaying = ref(false);
const isSeeking = ref(false);
const isPaused = ref(false);


// Audio Methods
const preload = async () => {
  console.log(`Preloading: ${selectedSound.value}`);

  try{

    await NativeAudio.preload({
      assetId: selectedSound.value,
      assetPath: getAssetPath(),
      audioChannelNum: 1,
      isUrl: false,
      volume: adjustVolume(volume.value)
    });
    console.debug(`Preloaded audio ${selectedSound.value}`)

    await getDuration();
  }catch (error:any){
    console.error(`Error preloading audio ${selectedSound.value}`, {selectedSound: selectedSound.value, error})
  }
}

const unload = async () => {
  console.log(`Unloading: ${selectedSound.value}`);

  try{
    await NativeAudio.unload({
      assetId: selectedSound.value
    });
    console.debug(`Unloaded audio ${selectedSound.value}`)
    selectedSoundDurationSecs.value = 0;
  }catch (error:any){
    console.error(`Error unloading audio ${selectedSound.value}`, {selectedSound: selectedSound.value, error})
  }
}

const play = async () => {
  try{
    const result = await NativeAudio.isPreloaded({
      assetId: selectedSound.value,
      assetPath: getAssetPath()
    });
    if(!result.found) {
      console.log(`Audio ${selectedSound.value} is not preloaded for playing. Preloading now...`);
      await preload();
    }else{
      await NativeAudio.setVolume({
        assetId: selectedSound.value,
        volume: adjustVolume(volume.value)
      });
    }


    console.debug(`Playing audio ${selectedSound.value}`)
    isPlaying.value = true;
    if(loop.value) {
      await NativeAudio.loop({
        assetId: selectedSound.value
      }).catch((error:any) => {
        console.debug(`Error looping audio ${selectedSound.value}`, error);
      });
    } else {

      console.log(`Playing audio ${selectedSound.value} with options:`, {
        time: time.value,
        volume: volume.value,
        adjustedVolume: adjustVolume(volume.value).toFixed(2),
        delay: startDelay.value,
        fadeIn: shouldFadeIn.value,
        fadeInDuration: fadeInDuration.value,
        fadeOut: shouldFadeOut.value,
        fadeOutDuration: fadeOutDuration.value,
        fadeOutStartTime: fadeOutStartTime.value
      });

      await NativeAudio.play({
        assetId: selectedSound.value,
        volume: adjustVolume(volume.value),
        time: time.value,
        delay: startDelay.value,
        fadeIn: shouldFadeIn.value,
        fadeInDuration: fadeInDuration.value,
        fadeOut: shouldFadeOut.value,
        fadeOutDuration: fadeOutDuration.value,
        fadeOutStartTime: fadeOutStartTime.value
      } as AssetPlayOptions).catch((error:any) => {
        console.error(`Error playing audio ${selectedSound.value}`, error);
      });
    }
  }catch (error:any){
    console.debug(`Error playing audio ${selectedSound.value}`, error);
  }
}

const stop = async () => {

  try{
    console.log(`Stopping audio ${selectedSound.value}`);

    await NativeAudio.stop({
      assetId: selectedSound.value,
      fadeOut: shouldFadeOut.value,
      fadeOutDuration: fadeOutDuration.value
    });
  }catch (error:any){
    console.error(`Error stopping audio ${selectedSound.value}`, error);
  }
}

const pause = async () => {
  try{
    console.log(`Pausing audio ${selectedSound.value}`);

    await NativeAudio.pause({
      assetId: selectedSound.value,
      fadeOut: shouldFadeOut.value,
      fadeOutDuration: fadeOutDuration.value
    });
  }catch (error:any){
    console.error(`Error pausing audio ${selectedSound.value}`, error);
  }

  isPaused.value = true;
}

const resume = async () => {
  try{
    console.log(`Resuming audio ${selectedSound.value}`);

    await NativeAudio.resume({
      assetId: selectedSound.value,
      fadeIn: shouldFadeIn.value,
      fadeInDuration: fadeInDuration.value
    });
  }catch (error:any){
    console.error(`Error resuming audio ${selectedSound.value}`, error);
  }

  isPaused.value = false;
}


// Input methods
const onChangeSelectedSound = (e: any) => {
  selectedSound.value = e.target.value;
}

const onChangeLoop = (e: any) => {
  loop.value = e.target.checked;
  if(loop.value){
    shouldFadeIn.value = false;
  }
}

const onChangeVolume = async (e: any) => {
  volume.value = e.target.value;
  const isPlaying = await NativeAudio.isPlaying({
    assetId: selectedSound.value
  });
  if(isPlaying){
    console.log(`Setting volume to ${volume.value} (adjusted: ${adjustVolume(volume.value).toFixed(2)})`);
    await NativeAudio.setVolume({
      assetId: selectedSound.value,
      volume: adjustVolume(volume.value),
      duration: volumeChangeDuration.value
    });
  }
}

const adjustVolume = (inputVolume: number) => {
  return (window as any)['adjustVolume'](inputVolume);
}

const defaultAdjustVolume = (inputVolume: number) => {
  return inputVolume;
}

const onChangeVolumeChangeDuration = async (e: any) => {
  volumeChangeDuration.value = e.target.value;
}

const onChangeStartDelay = async (e: any) => {
  startDelay.value = e.target.value;
}

const onChangeTime = async (e: any) => {
  time.value = e.target.value;
  isSeeking.value = true;
  await seekToTime();
}

// Fade input methods
const onChangeShouldFadeIn = (e: any) => {
  shouldFadeIn.value = e.target.checked;
}
const onChangeShouldFadeOut = (e: any) => {
  shouldFadeOut.value = e.target.checked;
}

const onChangeFadeInDuration = (e: any) => {
  fadeInDuration.value = e.target.value;
}
const onChangeFadeOutDuration = (e: any) => {
  fadeOutDuration.value = e.target.value;
}
const onChangeFadeOutStartTime = (e: any) => {
  fadeOutStartTime.value = e.target.value;
}

// Range formatter methods
const rangeTimeFormatter = (value: number) => {
  return value.toFixed(1) + 's';
}

const rangeNumberFormatter = (value: number) => {
  return value.toFixed(1)
}

// Helper methods
const getAssetPath = () => {
  let assetPath;
  // Audio is part of app content
  if(!Capacitor.isNativePlatform()){
    assetPath = `/assets/sounds/${selectedSound.value}.mp3`
  }else{
    assetPath = `public/assets/sounds/${selectedSound.value}.mp3`
  }
  return assetPath;
}

const getDuration = async () => {
  let duration;
  try{
    duration = await NativeAudio.getDuration({assetId: selectedSound.value});
  }catch (e) {
    console.error(`Error getting duration of audio ${selectedSound.value}`, e);
  }

  if(duration){
    selectedSoundDurationSecs.value = duration.duration;
    console.debug(`Audio ${selectedSound.value} duration is ${duration.duration} seconds`);
  }else{
    console.log(`No duration for audio ${selectedSound.value}`);
    selectedSoundDurationSecs.value = 0;
  }
}

const getMaxTime = () => {
  if(selectedSoundDurationSecs.value){
    return Math.floor(selectedSoundDurationSecs.value);
  }else{
    return 0;
  }
}

const getTimeStep = () => {
  if(selectedSoundDurationSecs.value){
    return selectedSoundDurationSecs.value / 10;
  }else{
    return 0;
  }
}

const onStopped = () => {
  isPlaying.value = false;
  time.value = 0;
}

// https://stackoverflow.com/a/72207078/777265
const debounce = (
    wait: number,
    callback: any,
    immediate = false,
)  => {
  // This is a number in the browser and an object in Node.js,
  // so we'll use the ReturnType utility to cover both cases.
  let timeout: ReturnType<typeof setTimeout> | null;

  return function <U>(this: U, ...args: never[]) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    const later = () => {
      timeout = null;

      if (!immediate) {
        return callback.apply(context, args);
      }
    };
    const callNow = immediate && !timeout;

    if (typeof timeout === "number") {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      return callback.apply(context, args);
    }
  };
}

const seekToTime = debounce(100,async () => {
  if(selectedSound.value && isPlaying){
    try{
      await NativeAudio.setCurrentTime({
        assetId: selectedSound.value,
        time: time.value
      });
      console.debug(`Set audio ${selectedSound.value} current time to ${time.value}`);
    }catch (error:any){
      console.error(`Error setting audio ${selectedSound.value} current time to ${time.value}`, error);
    }
  }
  isSeeking.value = false;
}, false);

// Event listeners
const onComplete = async (completeResult:any) => {
  console.log(`Audio ${completeResult.assetId} completed`);
  onStopped();
}

const onCurrentTime = async (currentTimeResult:any) => {
  // console.debug(`Audio ${currentTimeResult.assetId} current time is ${currentTimeResult.currentTime}`);
  if(!isSeeking.value){
    time.value = currentTimeResult.currentTime;
  }
}

// Lifecycle
onMounted(async () => {
  await NativeAudio.addListener('complete', onComplete);
  await NativeAudio.addListener('currentTime', onCurrentTime);

  // alias default volume adjustment function onto window object so it can be overridden
  (window as any)['adjustVolume'] = defaultAdjustVolume;
})
</script>

<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Capacitor Native Audio Test</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Capacitor Native Audio Test</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="content-inner">

        <div class="section">
          <ion-select
              :disabled="isPlaying"
              label="Select sound"
              placeholder="[No Sound]"
              @ionChange="(e) => { onChangeSelectedSound(e) }"
          >
            <ion-select-option value="notification">Notification</ion-select-option>
            <ion-select-option value="music">Music</ion-select-option>
          </ion-select>

          <p v-if="selectedSoundDurationSecs && selectedSoundDurationSecs > 0">
            Duration: {{ selectedSoundDurationSecs.toFixed(2) }} seconds
          </p>

          <ion-button expand="full" class="buttons" @click="preload" v-if="selectedSound && !isPlaying">
            Preload
          </ion-button>

          <ion-button expand="full" class="buttons" @click="unload" v-if="selectedSound && !isPlaying">
            Unload
          </ion-button>

          <ion-button expand="full" class="buttons" @click="play" v-if="selectedSound && !isPlaying">
            Play
          </ion-button>

          <ion-button expand="full" class="buttons" @click="stop" v-if="selectedSound && isPlaying">
            Stop
          </ion-button>

          <ion-button expand="full" class="buttons" @click="pause" v-if="selectedSound && isPlaying && !isPaused">
            Pause
          </ion-button>

          <ion-button expand="full" class="buttons" @click="resume" v-if="selectedSound && isPlaying && isPaused">
            Resume
          </ion-button>

        </div>

        <div class="section" v-if="selectedSound">
          <ion-checkbox
              justify="space-between"
              id="checkbox"
              value="checkbox"
              v-if="!isPlaying"
              :checked="loop"
              @ionChange="(e) => { onChangeLoop(e) }">
            Loop
          </ion-checkbox>

          <ion-range
              id="range"
              :value="volume"
              :min=0
              :max=1
              :step=0.1
              label-placement="fixed"
              label="Volume"
              :pin="true"
              :pin-formatter="rangeNumberFormatter"
              @ionChange="(e) => { onChangeVolume(e) }">
          </ion-range>
          <ion-range
              id="range"
              :value="volumeChangeDuration"
              :min=0
              :max=5
              :step=0.5
              label-placement="fixed"
              label="Volume Change Duration"
              :pin="true"
              :pin-formatter="rangeNumberFormatter"
              @ionChange="(e) => { onChangeVolumeChangeDuration(e) }">
          </ion-range>

          <ion-range
              id="range"
              v-if="!loop && !isPlaying"
              :value="startDelay"
              :min=0
              :max=5
              :step=1
              label-placement="fixed"
              label="Start Delay"
              :pin="true"
              :pin-formatter="rangeTimeFormatter"
              @ionChange="(e) => { onChangeStartDelay(e) }">
          </ion-range>

          <ion-range
              id="range"
              v-if="!loop && selectedSoundDurationSecs && selectedSoundDurationSecs > 1"
              :value="time"
              :min=0
              :max="getMaxTime()"
              :step="getTimeStep()"
              label-placement="fixed"
              label="Seek"
              color="success"
              :pin="true"
              :pin-formatter="rangeTimeFormatter"
              @ionChange="(e) => { onChangeTime(e) }">
          </ion-range>

        </div>

        <div class="section" v-if="!isPlaying && selectedSound">
          <ion-checkbox
              justify="space-between"
              id="checkbox"
              value="checkbox"
              :checked="shouldFadeIn"
              v-if="!loop"
              @ionChange="(e) => { onChangeShouldFadeIn(e) }">
            Fade In
          </ion-checkbox>

          <ion-range
              id="range"
              :value="fadeInDuration"
              :min=0
              :max=5
              :step=0.5
              label-placement="fixed"
              label="Fade In Duration"
              :pin="true"
              :pin-formatter="rangeTimeFormatter"
              v-if="shouldFadeIn"
              @ionChange="(e) => { onChangeFadeInDuration(e) }">
          </ion-range>

          <ion-checkbox
              justify="space-between"
              id="checkbox"
              value="checkbox"
              :checked="shouldFadeOut"
              @ionChange="(e) => { onChangeShouldFadeOut(e) }">
            Fade Out
          </ion-checkbox>
          <ion-range
              id="range"
              :value="fadeOutDuration"
              :min=0
              :max=5
              :step=0.5
              label-placement="fixed"
              label="Fade Out Duration"
              :pin="true"
              :pin-formatter="rangeTimeFormatter"
              v-if="shouldFadeOut"
              @ionChange="(e) => { onChangeFadeOutDuration(e) }">
          </ion-range>
          <ion-range
              id="range"
              :value="fadeOutStartTime"
              :min=0
              :max=5
              :step=0.5
              label-placement="fixed"
              label="Fade Out Start Time"
              :pin="true"
              :pin-formatter="rangeTimeFormatter"
              v-if="shouldFadeOut"
              @ionChange="(e) => { onChangeFadeOutStartTime(e) }">
          </ion-range>

        </div>


      </div>
    </ion-content>
  </ion-page>
</template>


<style scoped lang="scss">
ion-content {
  --background: transparent;

  &, #content {
    overflow: hidden;
  }
}

#content-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

ion-title {
  color: white !important;
}


.section {
  border-bottom: 1px solid var(--ion-text-color);
  padding-left: 0.5em;
  padding-right: 0.5em;
  padding-bottom: 1em;
  margin-bottom: 1em;
}

ion-button {
  text-align: center;
  margin-top: 2em;
}

ion-checkbox {
  width: 100%;
  margin: 0.5em 0;
}
ion-range {
  margin-bottom: 1em;
}


</style>
