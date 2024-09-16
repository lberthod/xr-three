<template>
    <div>
        <!-- Conteneur pour l'avatar 3D -->
        <div ref="avatarContainer" id="avatar" style="width: 100%; height: 100%;"></div>
        <!-- Bouton pour faire parler l'avatar -->
        <input v-model="textInput" placeholder="Entrez du texte" />
        <button @click="speakText">Parler</button>
    </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { TalkingHead } from '../libs/talkinghead.mjs'; // Importation locale depuis src/libs

export default {
    name: 'TalkingHead',
    setup() {
        const avatarContainer = ref(null);
        const textInput = ref('');

        let head; // Instance of TalkingHead

        onMounted(async () => {

            // Charger et afficher l'avatar
            try {
                head = new TalkingHead(avatar.value, {
                    ttsEndpoint: "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize",
                    ttsApikey: "AIzaSyDEU1C1L-9INvs9kbN5gfNhAEwzCqeVD_0",
                    cameraView: "upper"
                });
                await head.showAvatar({
                    url: 'https://models.readyplayer.me/65edce290d14e501b70ec1a5.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
                    body: 'F',
                    avatarMood: 'neutral',
                    ttsLang: "en-GB",
                    ttsVoice: "en-GB-Standard-A",
                    lipsyncLang: 'en'
                });
            } catch (error) {
                console.error("Erreur lors du chargement de l'avatar : ", error);
            }
        });

        // Fonction pour faire parler l'avatar
        const speakText = () => {
            if (head && textInput.value) {
                head.speakText(textInput.value);
            }
        };

        return {
            avatarContainer,
            textInput,
            speakText
        };
    }
};
</script>

<style scoped>
#avatar {
    width: 100%;
    height: 400px;
    background-color: #000;
}
</style>