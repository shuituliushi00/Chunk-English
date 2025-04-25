// 配置您的DeepSeek API Key
const API_KEY = "sk-a8710fa3c9bc43819475013b747532d3"; // 替换为您的实际API Key

// 场景学习模板
const LEARNING_TEMPLATES = [
    // 级别1: 基础短句
    (scene) => `请为"${scene}"场景生成3个最基础的英语短句，适合初学者使用。格式为：英文|中文解释。`,
    
    // 级别2: 添加细节
    (scene) => `为"${scene}"场景中的基础短句添加形容词/地点/时间等细节，生成3个升级版表达。格式：基础句 -> 升级句|解释`,
    
    // 级别3: 完整对话
    (scene) => `创建"${scene}"场景的6轮完整对话，包含自然的开始和结束。格式：A: 英文|中文 - B: 英文|中文`,
    
    // 级别4: 母语表达
    (scene) => `提供"${scene}"场景中母语者常用的3个高级表达或习语。格式：表达|字面意思|实际含义`
];

// DOM元素
const sceneInput = document.getElementById('sceneInput');
const searchBtn = document.getElementById('searchBtn');
const learningArea = document.getElementById('learningArea');
const progressSteps = document.querySelectorAll('.progress-step');
const exampleBtns = document.querySelectorAll('.example-btn');

// 当前学习状态
let currentScene = '';
let currentLevel = 1;

// 事件监听
searchBtn.addEventListener('click', startLearning);
exampleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        sceneInput.value = e.target.dataset.scene;
        startLearning();
    });
});

// 开始学习流程
async function startLearning() {
    const scene = sceneInput.value.trim();
    if (!scene) {
        alert('请输入要学习的场景关键词');
        return;
    }
    
    currentScene = scene;
    currentLevel = 1;
    updateProgressTracker();
    
    // 显示加载状态
    learningArea.innerHTML = `
        <div class="learning-card">
            <div class="card-header">正在准备"${scene}"场景的学习内容...</div>
            <div class="card-body">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> 正在生成学习材料
                </div>
            </div>
        </div>
    `;
    
    // 开始第一级别的学习
    await loadLearningContent(scene, 1);
}

// 加载学习内容
async function loadLearningContent(scene, level) {
    try {
        const prompt = LEARNING_TEMPLATES[level - 1](scene);
        const response = await callDeepSeekAPI(prompt);
        
        // 格式化响应内容
        const formattedContent = formatLearningContent(response, level);
        
        // 显示学习内容
        learningArea.innerHTML = `
            <div class="learning-card">
                <div class="card-header">${getLevelTitle(level)}: ${scene}</div>
                <div class="card-body">
                    ${formattedContent}
                    <div class="navigation-buttons">
                        ${level > 1 ? `<button class="nav-btn prev-btn" onclick="changeLevel(${level - 1})"><i class="fas fa-arrow-left"></i> 上一级</button>` : ''}
                        ${level < 4 ? `<button class="nav-btn next-btn" onclick="changeLevel(${level + 1})">下一级 <i class="fas fa-arrow-right"></i></button>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // 添加按钮样式
        addButtonStyles();
        
    } catch (error) {
        console.error('Error:', error);
        learningArea.innerHTML = `
            <div class="learning-card">
                <div class="card-header">出错啦</div>
                <div class="card-body">
                    <p>加载学习内容时出错，请稍后再试。</p>
                    <button onclick="startLearning()">重试</button>
                </div>
            </div>
        `;
    }
}

// 调用DeepSeek API
async function callDeepSeekAPI(prompt) {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 格式化学习内容
function formatLearningContent(content, level) {
    const lines = content.split('\n').filter(line => line.trim());
    let html = '';
    
    if (level === 1) {
        // 基础短句格式
        lines.forEach(line => {
            const [english, chinese] = line.split('|');
            html += `
                <div class="expression">
                    <div class="english">${english}</div>
                    <div class="chinese">${chinese}</div>
                </div>
            `;
        });
    } else if (level === 2) {
        // 升级表达格式
        lines.forEach(line => {
            const [basic, rest] = line.split(' -> ');
            const [advanced, explanation] = rest.split('|');
            
            html += `
                <div class="expression">
                    <div class="english">${basic}</div>
                    <div class="upgrade-arrow"><i class="fas fa-arrow-down"></i></div>
                    <div class="english">${advanced}</div>
                    <div class="chinese">${explanation}</div>
                </div>
            `;
        });
    } else if (level === 3) {
        // 完整对话格式
        lines.forEach(line => {
            const [aPart, bPart] = line.split(' - ');
            const [aEng, aChi] = aPart.split('|');
            const [bEng, bChi] = bPart.split('|');
            
            html += `
                <div class="expression">
                    <div class="english">${aEng}</div>
                    <div class="chinese">${aChi}</div>
                    <div class="english">${bEng}</div>
                    <div class="chinese">${bChi}</div>
                </div>
            `;
        });
    } else if (level === 4) {
        // 母语表达格式
        lines.forEach(line => {
            const [expression, literal, meaning] = line.split('|');
            
            html += `
                <div class="expression">
                    <div class="english">${expression}</div>
                    <div class="chinese"><strong>字面意思:</strong> ${literal}</div>
                    <div class="chinese"><strong>实际含义:</strong> ${meaning}</div>
                </div>
            `;
        });
    }
    
    return html;
}

// 获取级别标题
function getLevelTitle(level) {
    const titles = ['基础短句', '添加细节', '完整对话', '母语表达'];
    return titles[level - 1];
}

// 更新进度跟踪器
function updateProgressTracker() {
    progressSteps.forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.level) <= currentLevel) {
            step.classList.add('active');
        }
    });
}

// 改变学习级别
async function changeLevel(level) {
    currentLevel = level;
    updateProgressTracker();
    await loadLearningContent(currentScene, level);
}

// 添加按钮样式
function addButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .nav-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s;
            margin-top: 20px;
        }
        
        .prev-btn {
            background-color: var(--light);
            color: var(--dark);
            margin-right: 10px;
        }
        
        .next-btn {
            background-color: var(--primary);
            color: white;
        }
        
        .prev-btn:hover {
            background-color: var(--secondary);
            color: white;
        }
        
        .next-btn:hover {
            background-color: var(--dark);
        }
        
        .navigation-buttons {
            display: flex;
            justify-content: center;
            margin-top: 20px;
        }
    `;
    document.head.appendChild(style);
}