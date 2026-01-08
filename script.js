let fileInput = document.getElementById('fileInput');
let dropZone = document.getElementById('drop-zone');
let fill = document.getElementById('fill');
let questionDisplay = document.getElementById('question-display');
let answerGrid = document.getElementById('answer-grid');
let btnNext = document.getElementById('btn-next');
let scoreText = document.getElementById('score-text');

let quizData = []; 
let currentIndex = 0;
let score = 0;
let answered = false;
let wrongQuestions = []; 
let isReviewPhase = false; 

dropZone.onclick = () => fileInput.click();

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
    if (file && file.type === "text/plain") handleFile(file);
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
    restartSameQuiz();
}

function restartSameQuiz() {
    currentIndex = 0;
    wrongQuestions = [];
    isReviewPhase = false;
    quizData.sort(() => Math.random() - 0.5);
    resetQuizUI();
    renderQuestion();
}

function resetQuizUI() {
    document.getElementById('screen-quiz').innerHTML = `
        <div class="question-header">
            <span id="q-category">KIẾN THỨC CHUNG</span>
            <h2 id="question-display">...</h2>
        </div>
        <div id="answer-grid" class="answer-grid"></div>
        <div class="footer" style="display: flex; gap: 10px;">
            <button id="btn-skip" class="btn-primary" style="background: rgba(255, 255, 255, 0.1); color: rgba(197, 195, 195, 0.1);">Bỏ Qua</button>
            <button id="btn-next" class="btn-primary hide">Câu Tiếp Theo</button>
        </div>
    `;
    questionDisplay = document.getElementById('question-display');
    answerGrid = document.getElementById('answer-grid');
    btnNext = document.getElementById('btn-next');
    
    document.getElementById('btn-skip').onclick = () => handleSkip();
}

function renderQuestion() {
    answered = false;
    btnNext.classList.add('hide');
    document.getElementById('btn-skip').classList.remove('hide');
    answerGrid.innerHTML = '';
    
    const currentList = isReviewPhase ? wrongQuestions : quizData;
    const q = currentList[currentIndex];

    document.getElementById('q-category').innerText = isReviewPhase ? `ÔN LẠI (${currentIndex + 1}/${currentList.length})` : `CÂU HỎI ${currentIndex + 1}`;
    questionDisplay.innerText = q.q;

    fill.style.width = `${(currentIndex / currentList.length) * 100}%`;
    document.getElementById('progress-percent').innerText = `${Math.round((currentIndex / currentList.length) * 100)}%`;

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
        if (!wrongQuestions.includes(questionObj)) wrongQuestions.push(questionObj);
        showCorrectAnswer(questionObj, 'is-correct'); 
    }
    showNextButton();
}

function handleSkip() {
    if (answered) return;
    answered = true;
    
    const currentList = isReviewPhase ? wrongQuestions : quizData;
    const q = currentList[currentIndex];
    
    if (!wrongQuestions.includes(q)) wrongQuestions.push(q);
    
    document.getElementById('btn-skip').classList.add('hide');
    showCorrectAnswer(q, 'is-wrong'); 
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
        const currentList = isReviewPhase ? wrongQuestions : quizData;
        currentIndex++;
        if (currentIndex < currentList.length) {
            renderQuestion();
        } else {
            if (wrongQuestions.length > 0) {
                isReviewPhase = true;
                currentIndex = 0;
                const nextRound = [...wrongQuestions];
                wrongQuestions = []; 
                startNewRound(nextRound);
            } else {
                showFinalResult();
            }
        }
    };
}

function startNewRound(list) {
    wrongQuestions = [];
    quizData = list; 
    currentIndex = 0;
    renderQuestion();
}

function showFinalResult() {
    const screen = document.getElementById('screen-quiz');
    screen.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 4rem; margin-bottom: 10px;">🏆</div>
            <h1 style="font-size: 2.5rem; margin: 0; background: linear-gradient(to right, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Completed!</h1>
            <p style="margin: 15px 0; opacity: 0.8;">Bạn đã thuộc hết tất cả các câu hỏi trong bộ này.</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                <button class="btn-primary" onclick="restartSameQuiz()" style="background: #3b82f6; color: white; margin: 0;">Again</button>
                <button class="btn-primary" onclick="location.reload()" style="margin: 0;">Continue (TẢI FILE MỚI)</button>
            </div>
        </div>
    `;
    fill.style.width = '100%';
}
