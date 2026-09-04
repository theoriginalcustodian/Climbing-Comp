import math
import wave
import struct
import os
import sys

def generate_tone(filename, duration, frequencies, attack=0.01, release=0.1, sample_rate=44100):
    print(f"Generating {filename}...")
    n_samples = int(sample_rate * duration)
    audio = []
    
    for i in range(n_samples):
        t = float(i) / sample_rate
        sample = 0
        for freq in frequencies:
            sample += math.sin(2 * math.pi * freq * t)
        
        # Envelope (Attack / Release)
        env = 1.0
        if t < attack:
            env = t / attack
        elif t > duration - release:
            env = (duration - t) / release
            
        sample = sample * env * 0.5 # Volume
        
        # Clipping
        if sample > 1.0: sample = 1.0
        if sample < -1.0: sample = -1.0
        
        audio.append(int(sample * 32767.0))
        
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for s in audio:
            wav_file.writeframes(struct.pack('h', s))

# Create directory
os.makedirs('sonidos', exist_ok=True)

# Generate Tones
generate_tone('sonidos/horn_grave.wav', 1.0, [220, 440], attack=0.1, release=0.3)
generate_tone('sonidos/beep_agudo.wav', 0.2, [880], attack=0.01, release=0.05)
generate_tone('sonidos/doble_campana.wav', 0.6, [1046.50, 1318.51], attack=0.05, release=0.2)
generate_tone('sonidos/tick_rapido.wav', 0.1, [1500], attack=0.01, release=0.05)
generate_tone('sonidos/alarma_emergencia.wav', 0.5, [1000, 1200], attack=0.1, release=0.1)

# Generate Voices
try:
    from gtts import gTTS
    
    phrases = {
        'voz_inicio_preparacion.mp3': 'Atletas, inicio de preparación.',
        'voz_comienza_escalada.mp3': 'Comienza la escalada, ¡éxitos!',
        'voz_ultimos_segundos.mp3': 'Atención, últimos segundos.',
        'voz_tiempo_finalizado.mp3': 'Tiempo finalizado. Fin de la ronda.',
        'voz_inicio_pausa.mp3': 'Inicia el tiempo de pausa.',
        'voz_rotacion.mp3': 'Por favor, rotación de atletas.'
    }
    
    for filename, text in phrases.items():
        print(f"Generating voice {filename}...")
        tts = gTTS(text=text, lang='es', tld='com.mx') # Mexican Spanish accent
        tts.save(f"sonidos/{filename}")
        
    print("All sounds generated successfully.")
except ImportError:
    print("gTTS not installed, skipping voice generation.")
    sys.exit(1)
