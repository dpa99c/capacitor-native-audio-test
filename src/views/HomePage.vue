<script setup lang="ts">
import {onMounted} from "vue";
import {IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon} from '@ionic/vue';

import {playAudio} from "./useAudio";


// Methods
const playNotificationSound = async () => {
  console.log('play');
  await playAudio('notification');
}

// Lifecycle
onMounted(async () => {
  console.log('HomePage mounted');
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

        <ion-button expand="full" class="buttons" @click="playNotificationSound">
          <ion-icon slot="start" name="musical-notes"></ion-icon>
          Play Notification Sound
        </ion-button>

      </div>
    </ion-content>
  </ion-page>
</template>


<style scoped lang="scss">
.buttons {
  text-align: center;
}

ion-content {
  --background: transparent;

  &, #content {
    overflow: hidden;
  }
}

ion-title {
  color: white !important;
}

#content-inner {

  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;



}

</style>
