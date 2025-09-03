// ====== Fay 幣即時同步系統 ======

// 1. 創建一個全域的 Fay 幣管理器
class FayCoinManager {
  constructor() {
    this.listeners = new Set();
    this.balance = parseInt(localStorage.getItem('fayCoinBalance') || '0');
  }

  // 獲取當前餘額
  getBalance() {
    return this.balance;
  }

  // 更新餘額並通知所有監聽者
  updateBalance(newBalance) {
    const oldBalance = this.balance;
    this.balance = newBalance;
    localStorage.setItem('fayCoinBalance', newBalance.toString());
    
    // 通知所有監聽者
    this.notifyListeners(oldBalance, newBalance);
  }

  // 增加 Fay 幣
  addCoins(amount) {
    const newBalance = this.balance + amount;
    this.updateBalance(newBalance);
  }

  // 減少 Fay 幣
  subtractCoins(amount) {
    const newBalance = Math.max(0, this.balance - amount);
    this.updateBalance(newBalance);
  }

  // 註冊監聽器
  addListener(callback) {
    this.listeners.add(callback);
  }

  // 移除監聽器
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  // 通知所有監聽者
  notifyListeners(oldBalance, newBalance) {
    this.listeners.forEach(callback => {
      try {
        callback(newBalance, oldBalance);
      } catch (error) {
        console.error('Fay幣監聽器錯誤:', error);
      }
    });

    // 同時發送全域事件給其他頁面
    window.dispatchEvent(new CustomEvent('fayCoinChanged', {
      detail: { 
        newBalance: newBalance, 
        oldBalance: oldBalance,
        change: newBalance - oldBalance
      }
    }));

    // 使用 BroadcastChannel 通知其他分頁/窗口
    this.broadcastToOtherTabs(newBalance, oldBalance);
  }

  // 跨分頁通信
  broadcastToOtherTabs(newBalance, oldBalance) {
    try {
      const channel = new BroadcastChannel('faycoin-sync');
      channel.postMessage({
        type: 'BALANCE_UPDATED',
        newBalance: newBalance,
        oldBalance: oldBalance,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('跨分頁通信失敗:', error);
    }
  }

  // 監聽來自其他分頁的更新
  setupCrossTabSync() {
    try {
      const channel = new BroadcastChannel('faycoin-sync');
      channel.addEventListener('message', (event) => {
        if (event.data.type === 'BALANCE_UPDATED') {
          // 更新本地餘額但不廣播（避免無限循環）
          this.balance = event.data.newBalance;
          localStorage.setItem('fayCoinBalance', event.data.newBalance.toString());
          
          // 只通知本頁面的監聽器
          this.listeners.forEach(callback => {
            try {
              callback(event.data.newBalance, event.data.oldBalance);
            } catch (error) {
              console.error('跨分頁同步監聽器錯誤:', error);
            }
          });
        }
      });
    } catch (error) {
      console.error('設置跨分頁同步失敗:', error);
    }
  }
}

// 創建全域實例
window.fayCoinManager = new FayCoinManager();

// 設置跨分頁同步
window.fayCoinManager.setupCrossTabSync();

// 替換原有的 addFayCoins 函數
function addFayCoins(amount) {
  window.fayCoinManager.addCoins(amount);
}

// 新增減少 Fay 幣的函數
function subtractFayCoins(amount) {
  window.fayCoinManager.subtractCoins(amount);
}

// 任務頁監聽器設置
function setupTaskPageListener() {
  const updateTaskPageBalance = (newBalance, oldBalance) => {
    // 更新任務頁的餘額顯示（如果有的話）
    const balanceElements = document.querySelectorAll('.fay-coin-display, [data-balance]');
    balanceElements.forEach(el => {
      el.textContent = newBalance;
    });

    // 顯示獲得 Fay 幣的提示
    if (newBalance > oldBalance) {
      const gained = newBalance - oldBalance;
      showCoinGainedToast(gained);
    }
  };

  window.fayCoinManager.addListener(updateTaskPageBalance);
}

// 顯示獲得 Fay 幣的提示
function showCoinGainedToast(amount) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(45deg, #FFD700, #FFA500);
    color: black;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: bold;
    z-index: 9999;
    animation: slideInToast 0.3s ease-out;
  `;
  toast.textContent = `+${amount} Fay幣`;
  
  // 添加動畫樣式
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInToast {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInToast 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}


// ====== 管理員限制顯示任務控制工具 ======
const ADMINEMAILS = ['faywooooo@gmail.com'];
const currentUser = localStorage.getItem('userEmail') || '';
if (ADMINEMAILS.includes(currentUser)) {
} else {
  document.getElementById('taskAdminPanel').remove(); // 一般用戶完全移除
}


// 設置任務頁監聽器
setupTaskPageListener();

console.log('✅ Fay幣即時同步系統已載入 - 任務頁');

// ====== Firebase 配置 ======
const firebaseConfig = {
   apiKey: "AIzaSyAw3NxfRft4pke6TUl9gQ4a8P0LEm30zWo",
authDomain: "faycoin-bb878.firebaseapp.com",
projectId: "faycoin-bb878",
storageBucket: "faycoin-bb878.firebasestorage.app",
messagingSenderId: "665116400856",
appId: "1:665116400856:web:a263d792c69129400d8bad",
measurementId: "G-ZSZZD4W1HX"
};

// 初始化 Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 用戶資料
const userEmail = localStorage.getItem('userEmail') || '';
const userName = localStorage.getItem('userName') || '';
const userId = userEmail; // 統一使用 email 當 ID

// 管理員帳號設置
const ADMIN_EMAILS = ['faywooooo@gmail.com']; // 可以添加多個管理員
const isAdmin = ADMIN_EMAILS.includes(userEmail);

// 顯示管理面板
if (isAdmin) {
  document.getElementById('taskAdminPanel').style.display = 'block';
  console.log('🎯 任務管理面板已啟用');
}

// 任務系統 - 修改為支援無限制進度條
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1xOoP5iG4AJBKVTH1EFt0zzCcGnJP5PaJ1lWGhUwWOLA/gviz/tq?tqx=out:csv&sheet=工作表2';
const PROXY = 'https://corsproxy.io/?';
const cardsPerPage = 3;
let currentPage = 0, tasks = [];

// 儲存任務進度到 Firebase
async function saveTaskProgress(taskId, currentProgress) {
  try {
    const progressDocRef = doc(db, 'userTaskProgress', `${userEmail}_${taskId}`);
    await setDoc(progressDocRef, {
      userId: userId,
      taskId: taskId,
      currentProgress: currentProgress,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log(`任務 ${taskId} 進度已儲存到 Firebase: ${currentProgress}`);
  } catch (error) {
    console.error('儲存任務進度失敗:', error);
  }
}

// 從 Firebase 載入任務進度
async function loadTaskProgress(taskId) {
  try {
    const progressDocRef = doc(db, 'userTaskProgress', `${userEmail}_${taskId}`);
    const progressDoc = await getDoc(progressDocRef);
    
    if (progressDoc.exists()) {
      const data = progressDoc.data();
      return {
        currentProgress: data.currentProgress || 0,
        isCompleted: data.isCompleted || false,
        completedAt: data.completedAt || null,
        rewardClaimed: data.rewardClaimed || false
      };
    }
    return {
      currentProgress: 0,
      isCompleted: false,
      completedAt: null,
      rewardClaimed: false
    };
  } catch (error) {
    console.error('載入任務進度失敗:', error);
    return {
      currentProgress: 0,
      isCompleted: false,
      completedAt: null,
      rewardClaimed: false
    };
  }
}

// 監聽 Firebase 任務進度變化（實時同步）
function setupTaskProgressListener() {
  try {
    const progressCollection = collection(db, 'userTaskProgress');
    
    // 監聽當前用戶的所有任務進度變化
    onSnapshot(progressCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data();
          const docId = change.doc.id;
          
          // 檢查是否為當前用戶的任務進度
          if (docId.startsWith(`${userId}_`)) {
            const taskId = docId.replace(`${userId}_`, '');
            console.log(`🔄 檢測到任務進度變化: ${taskId}`, data);
            
            // 更新對應的任務卡片進度條
            updateTaskProgressDisplay(taskId, data);
            
            // 如果任務剛完成且尚未領取獎勵，自動發放獎勵
            if (data.isCompleted && !data.rewardClaimed) {
              autoClaimTaskReward(taskId, data);
            }
          }
        }
      });
    });
    
    console.log('✅ 任務進度即時監聽器已設置');
  } catch (error) {
    console.error('設置任務進度監聽器失敗:', error);
  }
}

// 自動發放任務完成獎勵
async function autoClaimTaskReward(taskId, progressData) {
  try {
    // 找到對應的任務資料
    const task = tasks.find(t => t.taskName === taskId);
    if (!task) {
      console.error('找不到任務資料:', taskId);
      return;
    }
    
    // 提取獎勵金額
    const rewardAmount = parseInt(task.points.match(/\d+/)?.[0] || '0');
    
    if (rewardAmount > 0) {
      // 發放 Fay 幣
      addFayCoins(rewardAmount);
      
      // 標記獎勵已領取
      const progressDocRef = doc(db, 'userTaskProgress', `${userEmail}_${taskId}`);
      await updateDoc(progressDocRef, {
        rewardClaimed: true,
        rewardClaimedAt: new Date().toISOString()
      });
      
      // 顯示獎勵通知
      showTaskCompletionToast(task.taskName, rewardAmount);
      
      console.log(`🎉 任務 "${taskId}" 完成獎勵已自動發放: ${rewardAmount} Fay幣`);
    }
    
  } catch (error) {
    console.error('自動發放任務獎勵失敗:', error);
  }
}

// 顯示任務完成提示
function showTaskCompletionToast(taskName, rewardAmount) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(45deg, #00ff00, #32cd32);
    color: black;
    padding: 15px 25px;
    border-radius: 15px;
    font-weight: bold;
    z-index: 9999;
    animation: bounceInToast 0.5s ease-out;
    box-shadow: 0 8px 20px rgba(0, 255, 0, 0.3);
    border: 2px solid #fff;
  `;
  toast.innerHTML = `
    🎉 任務完成！<br>
    "${taskName}"<br>
    獲得 ${rewardAmount} Fay幣
  `;
  
  // 添加動畫樣式
  if (!document.getElementById('task-completion-animations')) {
    const style = document.createElement('style');
    style.id = 'task-completion-animations';
    style.textContent = `
      @keyframes bounceInToast {
        0% { transform: translateX(-50%) scale(0.3); opacity: 0; }
        50% { transform: translateX(-50%) scale(1.05); }
        70% { transform: translateX(-50%) scale(0.9); }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'bounceInToast 0.5s ease-out reverse';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// 更新任務進度顯示
function updateTaskProgressDisplay(taskId, progressData) {
  const taskCards = document.querySelectorAll('.task-card');
  taskCards.forEach((card, index) => {
    if (tasks[index] && tasks[index].taskName === taskId) {
      const progressBar = card.querySelector('.task-progress-bar');
      const progressText = card.querySelector('.progress-text');
      const totalLength = tasks[index].totalLength;
      const currentProgress = progressData.currentProgress || 0;
      const isCompleted = progressData.isCompleted || false;
      
      // 更新進度條
      if (progressBar) {
        const progressBarClass = totalLength === 1 ? 'task-progress-bar single-segment' : 'task-progress-bar multiple-segments';
        const segmentClass = totalLength === 1 ? 'task-progress-segment single' : 'task-progress-segment multiple';
        
        progressBar.className = progressBarClass;
        progressBar.innerHTML = '';
        for (let i = 0; i < totalLength; i++) {
          const segment = document.createElement('div');
          segment.className = segmentClass;
          if (i < currentProgress) {
            segment.classList.add('filled');
          }
          progressBar.appendChild(segment);
        }
      }
      
      // 更新進度文字
      if (progressText) {
        if (isCompleted) {
          progressText.innerHTML = `<span style="color: #00ff00;">✅ 已完成！</span>`;
        } else {
          progressText.textContent = `進度：${currentProgress}/${totalLength}`;
        }
      }
      
      // 更新卡片樣式
      if (isCompleted) {
        card.classList.add('completed');
      } else {
        card.classList.remove('completed');
      }
      
      // 如果任務被禁用
      if (tasks[index].status === '-') {
        card.classList.add('disabled');
      }
    }
  });
}

async function fetchTasks() {
  try {
    const res = await fetch(PROXY + encodeURIComponent(CSV_URL));
    if (!res.ok) throw new Error('無法載入任務資料');
    const csv = await res.text();
    tasks = parseCSV(csv);
    if (tasks.length === 0) {
      document.getElementById('carousel').innerHTML = '<div style="color:#ccc; font-size:20px; padding:50px;">目前沒有任務資料</div>';
    } else {
      // 先初始化用戶任務進度記錄
      await initializeUserTaskProgress();
      // 再渲染任務
      await renderTasks(tasks, 'carousel', updateCarousel);
    }
  } catch (err) {
    console.error(err);
    document.getElementById('carousel').innerHTML = '<div style="color:red; font-size:20px; padding:50px;">載入任務失敗</div>';
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim() !== '');
  const headers = parseCSVLine(lines[0]);
  
  // 尋找所需欄位的索引 - progress 現在是進度條總長度
  const [idxName, idxDesc, idxPoints, idxStatus, idxProgress] = 
    ['taskName','description','points','status','progress'].map(h => headers.indexOf(h));
  
  const arr = [];
  for(let i=1; i<lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if(cols.length < headers.length) continue;
    
    arr.push({
      taskName: stripHTML(cols[idxName] || ''),
      description: cols[idxDesc] || '',
      points: cols[idxPoints] || '',
      status: cols[idxStatus] || '',
      totalLength: parseInt(cols[idxProgress]) || 5 // progress 欄位現在代表進度條總長度
    });
  }
  return arr;
}

function parseCSVLine(line) {
  const result = [], regex = /("([^"]|"")*"|[^,]*)/g;
  return [...line.matchAll(regex)].map(r => r[0].replace(/^"|"$/g, '').replace(/""/g, '').trim()).filter(s => s !== '');
}

async function renderTasks(taskList, containerId, updateFunc) {
  const carousel = document.getElementById(containerId);
  carousel.innerHTML = '';
  
  for (let i = 0; i < taskList.length; i++) {
    const task = taskList[i];
    const card = document.createElement('div');
    card.className = 'task-card';
    
    // 從 Firebase 載入個人進度
    const progressData = await loadTaskProgress(task.taskName);
    const currentProgress = progressData.currentProgress;
    const isCompleted = progressData.isCompleted;
    const totalLength = task.totalLength;
    
    // 根據任務狀態設置卡片樣式
    if(task.status === '+') {
      card.style.backgroundColor = 'rgba(230,255,237,0.5)';
      card.style.color = 'black';
    } else if(task.status === '-') {
      card.classList.add('disabled');
      card.style.backgroundColor = 'rgba(255,230,230,0.5)';
      card.style.color = '#999';
      card.style.textDecoration = 'line-through';
    }
    
    // 如果任務已完成，添加完成樣式
    if (isCompleted) {
      card.classList.add('completed');
    }
    
    // 動態生成進度條
    const progressBarClass = totalLength === 1 ? 'task-progress-bar single-segment' : 'task-progress-bar multiple-segments';
    const segmentClass = totalLength === 1 ? 'task-progress-segment single' : 'task-progress-segment multiple';
    
    const taskProgressHTML = `<div class="${progressBarClass}">` + 
      Array.from({length: totalLength}).map((_, index) => 
        `<div class="${segmentClass} ${index < currentProgress ? 'filled' : ''}"></div>`
      ).join('') + 
    '</div>';
    
    // 進度文字顯示
    const progressTextContent = isCompleted 
      ? `<span style="color: #00ff00;">✅ 已完成！</span>`
      : `進度：${currentProgress}/${totalLength}`;
    
    card.innerHTML = `
      <div class="task-name">${task.taskName}</div>
      <div class="task-desc">${task.description}</div>
      <div class="task-points">獎勵：${task.points} Fay幣</div>
      ${taskProgressHTML}
      <div class="progress-text" style="margin-top: 10px; font-size: 14px; color: #aaa;">
        ${progressTextContent}
      </div>
    `;
    
    carousel.appendChild(card);
  }
  
  updateFunc(taskList.length);
}

// 初始化用戶任務進度記錄
async function initializeUserTaskProgress() {
  try {
    console.log('🔄 初始化用戶任務進度記錄...');
    
    for (const task of tasks) {
      const progressDocRef = doc(db, 'userTaskProgress', `${userId}_${task.taskName}`);
      const progressDoc = await getDoc(progressDocRef);
      
      // 如果該任務進度不存在，創建初始記錄
      if (!progressDoc.exists()) {
        await setDoc(progressDocRef, {
          userId: userId,
          userEmail: userEmail,
          userName: userName,
          taskId: task.taskName,
          taskName: task.taskName,
          currentProgress: 0,
          totalProgress: task.totalLength,
          isCompleted: false,
          rewardClaimed: false,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
        
        console.log(`✅ 創建任務進度記錄: ${task.taskName}`);
      }
    }
    
    console.log('✅ 用戶任務進度初始化完成');
  } catch (error) {
    console.error('❌ 初始化用戶任務進度失敗:', error);
  }
}

function updateCarousel(taskCount = tasks.length) {
  const carousel = document.getElementById('carousel');
  const card = carousel.querySelector('.task-card');
  if (!card) return;
  const cardWidth = card.offsetWidth + parseFloat(getComputedStyle(card).marginLeft) + parseFloat(getComputedStyle(card).marginRight);
  const totalPages = Math.ceil(taskCount / cardsPerPage);
  if (currentPage >= totalPages) currentPage = 0;
  carousel.style.transform = `translateX(-${currentPage * cardsPerPage * cardWidth}px)`;
}

document.getElementById('prev-btn').onclick = () => {
  const totalPages = Math.ceil(tasks.length / cardsPerPage);
  currentPage = (currentPage - 1 + totalPages) % totalPages;
  updateCarousel();
};

document.getElementById('next-btn').onclick = () => {
  const totalPages = Math.ceil(tasks.length / cardsPerPage);
  currentPage = (currentPage + 1) % totalPages;
  updateCarousel();
};

// 窗口大小改變時重新計算輪播
window.addEventListener('resize', () => {
  updateCarousel();
});

// 初始化
window.onload = () => {
  fetchTasks();
  setupTaskProgressListener(); // 設置實時監聽
  setupAdminFeatures(); // 設置管理功能
};

// ====== 任務管理面板功能 ======

// 載入任務到下拉選單
function loadTasksToSelect() {
  const taskSelect = document.getElementById('select-task');
  taskSelect.innerHTML = '<option value="">選擇任務...</option>';
  
  tasks.forEach(task => {
    const option = document.createElement('option');
    option.value = task.taskName;
    option.textContent = `${task.taskName} (${task.points})`;
    taskSelect.appendChild(option);
  });
}

// 搜尋用戶功能
async function searchUsers() {
  const searchTerm = document.getElementById('search-user-email').value.trim().toLowerCase();
  const resultsDiv = document.getElementById('user-search-results');
  
  if (searchTerm.length < 2) {
    resultsDiv.style.display = 'none';
    return;
  }
  
  try {
    // 使用 getDocs 來搜尋用戶
    const { getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
    const usersCollection = collection(db, 'userTaskProgress');
    const snapshot = await getDocs(usersCollection);
    
    const users = new Set(); // 使用 Set 避免重複
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const email = data.userEmail || '';
      if (email.toLowerCase().includes(searchTerm)) {
        users.add(JSON.stringify({
          email: email,
          name: data.userName || '未知'
        }));
      }
    });
    
    resultsDiv.innerHTML = '';
    
    if (users.size === 0) {
      resultsDiv.innerHTML = '<div style="color: #ccc;">找不到匹配的用戶</div>';
    } else {
      Array.from(users).forEach(userStr => {
        const user = JSON.parse(userStr);
        const item = document.createElement('div');
        item.className = 'user-result-item';
        item.textContent = `${user.email} (${user.name})`;
        item.onclick = () => {
          document.getElementById('search-user-email').value = user.email;
          resultsDiv.style.display = 'none';
        };
        resultsDiv.appendChild(item);
      });
    }
    
    resultsDiv.style.display = 'block';
    
  } catch (error) {
    console.error('搜尋用戶失敗:', error);
    resultsDiv.innerHTML = '<div style="color: red;">搜尋失敗</div>';
    resultsDiv.style.display = 'block';
  }
}

// 更新用戶任務進度
window.updateUserTaskProgress = async function() {
  if (!isAdmin) {
    alert('❌ 權限不足');
    return;
  }
  
  const targetEmail = document.getElementById('search-user-email').value.trim();
  const taskName = document.getElementById('select-task').value;
  const progressValue = parseInt(document.getElementById('progress-value').value);
  
  if (!targetEmail || !taskName || isNaN(progressValue)) {
    alert('⚠️ 請填寫完整資訊');
    return;
  }
  
  try {
    const progressDocRef = doc(db, 'userTaskProgress', `${targetEmail}_${taskName}`);
    
    // 獲取任務總長度
    const task = tasks.find(t => t.taskName === taskName);
    const totalLength = task ? task.totalLength : 5;
    
    const updateData = {
      currentProgress: Math.max(0, Math.min(progressValue, totalLength)),
      isCompleted: progressValue >= totalLength,
      lastUpdated: new Date().toISOString()
    };
    
    if (progressValue >= totalLength) {
      updateData.completedAt = new Date().toISOString();
    }
    
    await updateDoc(progressDocRef, updateData);
    
    alert(`✅ 更新成功！\n用戶：${targetEmail}\n任務：${taskName}\n進度：${updateData.currentProgress}/${totalLength}`);
    
  } catch (error) {
    console.error('更新任務進度失敗:', error);
    alert('❌ 更新失敗：' + error.message);
  }
};

// 完成用戶任務
window.completeUserTask = async function() {
  if (!isAdmin) {
    alert('❌ 權限不足');
    return;
  }
  
  const targetEmail = document.getElementById('search-user-email').value.trim();
  const taskName = document.getElementById('select-task').value;
  
  if (!targetEmail || !taskName) {
    alert('⚠️ 請選擇用戶和任務');
    return;
  }
  
  try {
    const progressDocRef = doc(db, 'userTaskProgress', `${targetEmail}_${taskName}`);
    const task = tasks.find(t => t.taskName === taskName);
    const totalLength = task ? task.totalLength : 5;
    
    await updateDoc(progressDocRef, {
      currentProgress: totalLength,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    
    alert(`🎉 任務完成！\n用戶：${targetEmail}\n任務：${taskName}\n系統將自動發放獎勵`);
    
  } catch (error) {
    console.error('完成任務失敗:', error);
    alert('❌ 操作失敗：' + error.message);
  }
};

// 重置用戶任務
window.resetUserTask = async function() {
  if (!isAdmin) {
    alert('❌ 權限不足');
    return;
  }
  
  const targetEmail = document.getElementById('search-user-email').value.trim();
  const taskName = document.getElementById('select-task').value;
  
  if (!targetEmail || !taskName) {
    alert('⚠️ 請選擇用戶和任務');
    return;
  }
  
  const confirmReset = confirm(`⚠️ 確定要重置用戶 ${targetEmail} 的任務 "${taskName}" 嗎？\n此操作會將進度歸零且無法復原。`);
  
  if (!confirmReset) return;
  
  try {
    const progressDocRef = doc(db, 'userTaskProgress', `${targetEmail}_${taskName}`);
    
    await updateDoc(progressDocRef, {
      currentProgress: 0,
      isCompleted: false,
      completedAt: null,
      rewardClaimed: false,
      rewardClaimedAt: null,
      lastUpdated: new Date().toISOString()
    });
    
    alert(`🔄 重置成功！\n用戶：${targetEmail}\n任務：${taskName}\n進度已重置為 0`);
    
  } catch (error) {
    console.error('重置任務失敗:', error);
    alert('❌ 重置失敗：' + error.message);
  }
};

// 查詢用戶所有任務
window.queryUserTasks = async function() {
  if (!isAdmin) {
    alert('❌ 權限不足');
    return;
  }
  
  const targetEmail = document.getElementById('search-user-email').value.trim();
  
  if (!targetEmail) {
    alert('⚠️ 請輸入用戶 Email');
    return;
  }
  
  try {
    const { getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
    const progressCollection = collection(db, 'userTaskProgress');
    const q = query(progressCollection, where('userEmail', '==', targetEmail));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      alert(`❌ 找不到用戶 ${targetEmail} 的任務資料`);
      return;
    }
    
    let taskSummary = `📊 用戶任務總覽：${targetEmail}\n`;
    taskSummary += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    let completedCount = 0;
    let totalTasks = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalTasks++;
      
      if (data.isCompleted) completedCount++;
      
      taskSummary += `📋 ${data.taskName}\n`;
      taskSummary += `   進度：${data.currentProgress}/${data.totalProgress || '?'}\n`;
      taskSummary += `   狀態：${data.isCompleted ? '✅ 已完成' : '⏳ 進行中'}\n`;
      taskSummary += `   獎勵：${data.rewardClaimed ? '已領取' : '未領取'}\n`;
      taskSummary += `   更新：${data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '無'}\n\n`;
    });
    
    taskSummary += `━━━━━━━━━━━━━━━━━━━━\n`;
    taskSummary += `📈 總計：${completedCount}/${totalTasks} 個任務完成`;
    
    alert(taskSummary);
    
  } catch (error) {
    console.error('查詢用戶任務失敗:', error);
    alert('❌ 查詢失敗：' + error.message);
  }
};

// 為用戶初始化所有任務
window.initAllUserTasks = async function() {
  if (!isAdmin) {
    alert('❌ 權限不足');
    return;
  }
  
  const targetEmail = document.getElementById('search-user-email').value.trim();
  
  if (!targetEmail) {
    alert('⚠️ 請輸入用戶 Email');
    return;
  }
  
  const confirmInit = confirm(`⚠️ 確定要為用戶 ${targetEmail} 初始化所有任務嗎？\n這會創建 ${tasks.length} 個任務記錄。`);
  
  if (!confirmInit) return;
  
  try {
    let successCount = 0;
    
    for (const task of tasks) {
      const progressDocRef = doc(db, 'userTaskProgress', `${targetEmail}_${task.taskName}`);
      
      await setDoc(progressDocRef, {
        userId: targetEmail,
        userEmail: targetEmail,
        userName: targetEmail.split('@')[0],
        taskId: task.taskName,
        taskName: task.taskName,
        currentProgress: 0,
        totalProgress: task.totalLength,
        isCompleted: false,
        rewardClaimed: false,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      successCount++;
    }
    
    alert(`✅ 初始化完成！\n用戶：${targetEmail}\n成功創建 ${successCount} 個任務記錄`);
    
  } catch (error) {
    console.error('初始化用戶任務失敗:', error);
    alert('❌ 初始化失敗：' + error.message);
  }
};

// 設置管理功能
function setupAdminFeatures() {
  if (!isAdmin) return;
  
  // 載入任務到下拉選單
  setTimeout(() => {
    loadTasksToSelect();
  }, 1000);
  
  // 設置用戶搜尋
  const searchInput = document.getElementById('search-user-email');
  if (searchInput) {
    searchInput.addEventListener('input', searchUsers);
    
    // 點擊外部隱藏搜尋結果
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-user-email') && !e.target.closest('#user-search-results')) {
        document.getElementById('user-search-results').style.display = 'none';
      }
    });
  }
  
  console.log('🎯 管理功能已初始化');
}

async function grantCoins(amount) {
  const email = localStorage.getItem("userEmail");
  const snapshot = await db.collection("userLoginRewards").where("userEmail", "==", email).get();

  let expiry = 0;
  let multiplier = 1;
  if (!snapshot.empty) {
    expiry = snapshot.docs[0].data().multiplierExpiry || 0;
    multiplier = snapshot.docs[0].data().coinMultiplier || 1;
  }

  let now = Date.now();
  if (expiry > now) {
    amount *= multiplier; // 套用倍率
  }

  // ⚡ 用 FayCoinManager 加幣
  window.fayCoinManager.addCoins(amount);
}

window.fayCoinManager.addCoins(10)
