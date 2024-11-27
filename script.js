const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');
const colorBox = document.getElementById('colorBox');
const startBtn = document.getElementById('startBtn');

let currentAudio = null; // 현재 재생 중인 오디오

// 모델 파일 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(() => {
    startBtn.addEventListener('click', startVideo); // 버튼 클릭 시 시작
});

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));

    startBtn.style.display = 'none'; // 버튼 숨김
}

video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const highestExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            updateColorBox(expressions);
            updateExpressionText(highestExpression);
            playEmotionMusic(highestExpression);
        } else {
            handleNoFaceDetected();
        }
    }, 100);
});

function updateColorBox(expressions) {
    const red = Math.round(
        expressions.anger * 255 + 
        expressions.happy * 255 + 
        expressions.surprised * 128 + 
        expressions.fear * 128
    );
    const green = Math.round(
        expressions.happy * 255 + 
        expressions.neutral * 255 + 
        expressions.surprised * 165
    );
    const blue = Math.round(
        expressions.sad * 255 + 
        expressions.neutral * 128 + 
        expressions.fear * 255
    );

    const gradientColor = `rgb(${red}, ${green}, ${blue})`;

    // 가장 큰 비율의 감정에 따른 색상 정의
    colorBox.style.background = `linear-gradient(to bottom, ${gradientColor}, white)`;
}

function updateExpressionText(highestExpression) {
    if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
        expressionDiv.style.opacity = 0;
        setTimeout(() => {
            expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
            expressionDiv.style.opacity = 1;
        }, 500);
    }
}

function playEmotionMusic(emotion) {
    const emotionMusic = {
        happy: './audio/happy.mp3',
        sad: './audio/sad.mp3',
        anger: './audio/anger.mp3',
        neutral: './audio/neutral.mp3',
        surprised: './audio/surprised.mp3',
        fear: './audio/fear.mp3'
    };

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(emotionMusic[emotion]);
    currentAudio.volume = 0.5;

    currentAudio.play().catch(err => {
        console.error('Audio play error:', err);
        alert("브라우저의 자동 재생 정책으로 인해 음악이 차단되었습니다. 한 번 더 클릭해 주세요.");
    });
}

function handleNoFaceDetected() {
    if (expressionDiv.textContent !== 'No face detected') {
        expressionDiv.style.opacity = 0;
        setTimeout(() => {
            expressionDiv.textContent = 'No face detected';
            expressionDiv.style.opacity = 1;
        }, 500);
    }
    colorBox.style.background = 'white';
}
