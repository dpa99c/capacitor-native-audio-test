import {NativeAudio} from "@capgo/native-audio";
import {Capacitor} from "@capacitor/core";



export type AudioOpts = {
    walk?: string, // name of walk to load audio from
    filename?: string, // name of audio file to load from walk content
    volume?: number, // volume level (0-1)
    loop?: boolean, // whether to loop the audio
    delay?: number, // delay in seconds before playing audio
    stop_type?: string, // type of stop to use
    keepLoaded?: boolean, // whether to keep audio loaded after playing
    omitPreload?: boolean // whether to skip preloading audio
    format?: 'mp3' | 'wav' // audio format
}

/*********************
 * Internal functions
 ********************/

async function clearupAudio(audioName:string, _opts?:AudioOpts){
    const opts = _opts || {};
    try{
        if(await NativeAudio.isPlaying({assetId: audioName})){
            await NativeAudio.stop({
                assetId: audioName
            });
        }
        if(!opts.keepLoaded){
            await NativeAudio.unload({
                assetId: audioName
            });
        }
    }catch(error:any){
        console.debug(`Error unloading audio ${audioName}`, error);
    }

}

/*********************
 * Public functions
 ********************/
export async function initialiseAudio(){
    if(!Capacitor.isNativePlatform()) return console.debug(`Audio configuration is not supported on web platform`);

    try{
        await NativeAudio.configure({
            fade: false
        })
    }catch (error:any){
        console.error(`Error configuring audio`, error);
    }
}

export async function preloadAudio(audioName:string, _opts?:AudioOpts){
    return new Promise((resolve) => {
        (async function (){
            try{
                const opts = _opts || {};

                let assetPath;
                const isUrl = false;
                const fileExt = opts.format || 'mp3';
                // Audio is part of app content
                if(!Capacitor.isNativePlatform()){
                    assetPath = `/assets/sounds/${audioName}.${fileExt}`
                }else{
                    assetPath = `public/assets/sounds/${audioName}.${fileExt}`
                }

                await NativeAudio.preload({
                    assetId: audioName,
                    assetPath,
                    audioChannelNum: 1,
                    isUrl,
                    volume: opts.volume || 1
                });

                console.debug(`Preloaded audio ${audioName}`)
            }catch (error:any){
                console.error(`Error preloading audio ${audioName}`, {audioName, error})
                resolve(false);
            }
        })();
    });
}

export async function playAudio(audioName:string, _opts?:AudioOpts){
    return new Promise((resolve) => {
        (async function (){
            try{
                const opts = _opts || {};


                let assetPath;
                const isUrl = false;
                const fileExt = opts.format || 'mp3';
                // Audio is part of app content
                if(!Capacitor.isNativePlatform()){
                    assetPath = `/assets/sounds/${audioName}.${fileExt}`
                }else{
                    assetPath = `public/assets/sounds/${audioName}.${fileExt}`
                }
                const volume = opts.volume || 1;
                if(!opts.omitPreload) {
                    await NativeAudio.preload({
                        assetId: audioName,
                        assetPath,
                        audioChannelNum: 1,
                        isUrl,
                        volume
                    });
                    await NativeAudio.setVolume({
                        assetId: audioName,
                        volume
                    });
                    console.debug(`Preloaded audio ${audioName}`)
                }

                const delay = opts.delay || 0;
                setTimeout(async () => {
                    try{
                        console.debug(`Playing audio ${audioName} after ${delay}s delay`)

                        if(opts.loop) {
                            NativeAudio.play({
                                assetId: audioName,
                                time: 0
                            }).catch((error:any) => {
                                console.debug(`Error playing audio ${audioName}`, {audioName, error});
                            });
                            NativeAudio.loop({
                                assetId: audioName
                            }).catch((error:any) => {
                                console.debug(`Error looping audio ${audioName}`, {audioName, error});
                            });
                            return resolve(true);
                        } else {

                            NativeAudio.play({
                                assetId: audioName,
                                time: 0
                            }).catch((error:any) => {
                                console.debug(`Error playing audio ${audioName}`, {audioName, error});
                            });
                            if (!Capacitor.isNativePlatform()) {
                                // Hack to get around issue with NativeAudio.play() not working on the first call on web platform
                                NativeAudio.play({
                                    assetId: audioName
                                }).catch((error:any) => {
                                    console.debug(`Error playing audio ${audioName}`, {audioName, error});
                                });
                                return resolve(true);
                            } else {
                                const durationSecs = await NativeAudio.getDuration({assetId: audioName}),
                                    durationMs = durationSecs.duration * 1000;
                                setTimeout(() => {
                                    console.debug(`Finished playing audio ${audioName} after ${durationMs}ms`);
                                    clearupAudio(audioName, {keepLoaded: opts.keepLoaded})
                                    return resolve(true);
                                }, durationMs + 100); // Add 100ms to duration to ensure audio has finished playing
                            }
                        }
                    }catch (error:any){
                        console.debug(`Error playing audio ${audioName}`, {audioName, error});
                        resolve(false);
                    }
                }, delay*1000);
            }catch (error:any){
                console.debug(`Error playing audio ${audioName}`, {audioName, error});
                resolve(false);
            }
        })();
    });
}
