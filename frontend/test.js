// First install the required packages:
// npm install @google-cloud/speech fs

const speech = require('@google-cloud/speech');
const fs = require('fs');

async function transcribeSpeechWithLanguageDetection(audioFilePath) {
    try {
        // Creates a client
        const client = new speech.SpeechClient({
            keyFilename: 'path/to/your/google-cloud-credentials.json'
        });

        // Reads the audio file into memory
        const audioContent = fs.readFileSync(audioFilePath).toString('base64');

        // Configure the request with language detection
        const config = {
            encoding: 'LINEAR16',  // encoding type, adjust based on your audio file
            sampleRateHertz: 16000,  // sample rate, adjust based on your audio file
            enableAutomaticPunctuation: true,
            model: 'default',
            // Enable language detection
            languageCode: 'und',  // 'und' tells the API to detect the language
            alternativeLanguageCodes: [
                'en-US', 'es-ES', 'fr-FR', 'de-DE', 
                'hi-IN', 'ja-JP', 'zh', 'ru-RU',
                'ar-SA', 'ko-KR', 'it-IT', 'pt-BR'
            ]
        };

        const audio = {
            content: audioContent
        };

        const request = {
            config: config,
            audio: audio
        };

        // Detects speech in the audio file
        const [response] = await client.recognize(request);
        
        // Get results with detected language
        const result = {
            transcription: '',
            detectedLanguage: ''
        };

        if (response.results && response.results.length > 0) {
            // Get the transcription
            result.transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            // Get the detected language
            if (response.results[0].languageCode) {
                result.detectedLanguage = response.results[0].languageCode;
            }
        }

        return result;

    } catch (error) {
        console.error('Error during transcription:', error);
        throw error;
    }
}

// Example usage with automatic language detection
async function main() {
    try {
        // Test with different audio files
        const files = [
            './audio/unknown-language-1.wav',
            './audio/unknown-language-2.wav'
        ];

        for (const file of files) {
            const result = await transcribeSpeechWithLanguageDetection(file);
            console.log(`\nResults for ${file}:`);
            console.log('Detected Language:', result.detectedLanguage);
            console.log('Transcription:', result.transcription);
        }

    } catch (error) {
        console.error('Error in main:', error);
    }
}

// Run the example
main();

// Helper function to get language name from language code
function getLanguageName(languageCode) {
    const languageMap = {
        'en-US': 'English (US)',
        'es-ES': 'Spanish',
        'fr-FR': 'French',
        'de-DE': 'German',
        'hi-IN': 'Hindi',
        'ja-JP': 'Japanese',
        'zh': 'Chinese',
        'ru-RU': 'Russian',
        'ar-SA': 'Arabic',
        'ko-KR': 'Korean',
        'it-IT': 'Italian',
        'pt-BR': 'Portuguese (Brazil)'
    };
    return languageMap[languageCode] || languageCode;
}