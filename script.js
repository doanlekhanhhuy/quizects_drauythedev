let fileInput = document.getElementById('fileInput');
let dropZone = document.getElementById('drop-zone');
let fill = document.getElementById('fill');
let scoreText = document.getElementById('score-text');

let quizData = []; 
let currentRoundData = []; // Danh sách câu hỏi của vòng hiện tại
let currentIndex = 0;
let score = 0;
let answered = false;
let wrongQuestions = []; 
let isReviewPhase = false; 

// Khai báo lại các biến động sau khi reset UI
let questionDisplay, answerGrid, btnNext;

dropZone.onclick = () => fileInput.click();

// --- XỬ LÝ FILE ---
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--primary)";
        dropZone.style.background = "rgba(129, 140, 248, 0.1)";
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "rgba(255,255,255,0.2)";
        dropZone.style.background = "transparent";
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
}, false);

fileInput.onchange = (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
};

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = () => processFile(reader.result);
    reader.readAsText(file);
}

function processFile(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    quizData = [];
    let current = null;

    lines.forEach(line => {
        if (line.match(/^Câu \d+/) || line.includes('?')) {
            if (current) quizData.push(current);
            current = { q: line.replace(/^Câu \d+\.?\s*/, ''), a: [] };
        } else if (current) {
            let correct = line.includes('*');
            let txt = line.replace(/^[A-DA-D]\.\s*/i, '').replace('*', '').trim();
            current.a.push({ txt, correct });
        }
    });
    if (current) quizData.push(current);
    startQuiz();
}

// --- LOGIC TRÒ CHƠI ---

function startQuiz() {
    document.getElementById('screen-upload').classList.add('hide');
    document.getElementById('screen-quiz').classList.remove('hide');
    score = 0;
    scoreText.innerText = `Đúng: 0`;
    
    // Tạo bản sao để xáo trộn lần đầu
    currentRoundData = [...quizData];
    restartSameQuiz();
}

function restartSameQuiz() {
    currentIndex = 0;
    wrongQuestions = [];
    isReviewPhase = false;
    currentRoundData = [...quizData].sort(() => Math.random() - 0.5);
    resetQuizUI();
    renderQuestion();
}

function resetQuizUI() {
    const screenQuiz = document.getElementById('screen-quiz');
    screenQuiz.innerHTML = `
        <div class="question-header">
            <span id="q-category" style="color: var(--ios-blue); font-weight: 800; font-size: 12px; letter-spacing: 1px;">KIẾN THỨC CHUNG</span>
            <h2 id="question-display" style="margin-top:10px;">...</h2>
        </div>
        <div id="answer-grid" class="answer-layout" style="margin-top:20px;"></div>
        <div class="footer" style="display: flex; gap: 10px; margin-top: 30px;">
            <button id="btn-skip" class="btn-primary-ios" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; flex: 1; padding: 15px; border-radius: 20px; cursor: pointer;">Bỏ Qua</button>
            <button id="btn-next" class="btn-primary-ios hide" style="background: #fff; color: #000; flex: 1; padding: 15px; border-radius: 20px; font-weight: 700; cursor: pointer;">Câu Tiếp Theo</button>
        </div>
    `;
    
    questionDisplay = document.getElementById('question-display');
    answerGrid = document.getElementById('answer-grid');
    btnNext = document.getElementById('btn-next');
    
    document.getElementById('btn-skip').onclick = () => handleSkip();
}

function renderQuestion() {
    if (!currentRoundData[currentIndex]) return; // Phòng thủ lỗi undefined

    answered = false;
    btnNext.classList.add('hide');
    document.getElementById('btn-skip').classList.remove('hide');
    answerGrid.innerHTML = '';
    
    const q = currentRoundData[currentIndex];

    document.getElementById('q-category').innerText = isReviewPhase ? `ÔN LẠI (${currentIndex + 1}/${currentRoundData.length})` : `CÂU HỎI ${currentIndex + 1} / ${currentRoundData.length}`;
    questionDisplay.innerText = q.q;

    // Cập nhật Progress Bar
    const progress = (currentIndex / currentRoundData.length) * 100;
    fill.style.width = `${progress}%`;

    // Render đáp án
    [...q.a].sort(() => Math.random() - 0.5).forEach(ans => {
        const div = document.createElement('div');
        div.className = 'choice-card';
        div.innerText = ans.txt;
        div.onclick = () => handleCheck(div, ans.correct, q);
        answerGrid.appendChild(div);
    });
}

function handleCheck(el, isCorrect, questionObj) {
    if (answered) return;
    answered = true;
    document.getElementById('btn-skip').classList.add('hide');
    
    if (isCorrect) {
        el.classList.add('is-correct');
        if (!isReviewPhase) {
            score++;
            scoreText.innerText = `Đúng: ${score}`;
        }
    } else {
        el.classList.add('is-wrong');
        if (!wrongQuestions.some(item => item.q === questionObj.q)) {
            wrongQuestions.push(questionObj);
        }
        showCorrectAnswer(questionObj, 'is-correct'); 
    }
    showNextButton();
}

function handleSkip() {
    if (answered) return;
    answered = true;
    
    const q = currentRoundData[currentIndex];
    if (!wrongQuestions.some(item => item.q === q.q)) {
        wrongQuestions.push(q);
    }
    
    document.getElementById('btn-skip').classList.add('hide');
    showCorrectAnswer(q, 'is-wrong'); // Hiện màu đỏ viền trắng để cảnh báo
    showNextButton();
}

function showCorrectAnswer(qObj, className) {
    Array.from(answerGrid.children).forEach(child => {
        const data = qObj.a.find(item => item.txt === child.innerText);
        if (data && data.correct) {
            child.classList.add(className);
            if(className === 'is-wrong') child.style.border = "2px solid white"; 
        }
    });
}

function showNextButton() {
    btnNext.classList.remove('hide');
    btnNext.onclick = () => {
        currentIndex++;
        if (currentIndex < currentRoundData.length) {
            renderQuestion();
        } else {
            if (wrongQuestions.length > 0) {
                // Sang vòng ôn lại những câu sai
                isReviewPhase = true;
                currentRoundData = [...wrongQuestions].sort(() => Math.random() - 0.5);
                wrongQuestions = []; 
                currentIndex = 0;
                renderQuestion();
            } else {
                showFinalResult();
            }
        }
    };
}

function showFinalResult() {
    const screen = document.getElementById('screen-quiz');
    fill.style.width = '100%';
    screen.innerHTML = `
        <div style="text-align: center; padding: 40px 0; animation: fadeIn 0.5s ease;">
            <div style="font-size: 5rem; margin-bottom: 20px;">🏆</div>
            <h1 style="font-size: 2.5rem; margin: 0; background: linear-gradient(to right, #32D74B, #0A84FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Sứ Mệnh Hoàn Thành!</h1>
            <p style="margin: 20px 0; opacity: 0.8; font-size: 1.1rem;">Bạn đã ghi nhớ hoàn toàn bộ câu hỏi này.</p>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 30px;">
                <button class="btn-primary-ios" onclick="restartSameQuiz()" style="background: #fff; color: #000; border: none; padding: 18px; border-radius: 20px; font-weight: 800; cursor: pointer;">Luyện Lại Lần Nữa</button>
                <button class="btn-primary-ios" onclick="location.reload()" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 18px; border-radius: 20px; cursor: pointer;">Chọn Bài Mới</button>
            </div>
        </div>
    `;
}
