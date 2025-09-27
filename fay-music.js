// ----------------------------
// Fay Music 共用模組
// ----------------------------

const musicLevels = [3,13,23,33,43,53,63];   // 官方音樂解鎖等級
const customMusicLevels = [73,83,93];        // 自訂音樂解鎖等級

const officialMusic = {
  3: "/music/BS_Subway_Surfer.mp3",
  13: "/music/song2.mp3",
  23: "/music/song3.mp3",
  33: "/music/song4.mp3",
  43: "/music/song5.mp3",
  53: "/music/song6.mp3",
  63: "/music/song7.mp3",
  73: "/music/song8.mp3",
  83: "/music/song9.mp3",
  93: "/music/song10.mp3"
};

let selectedMusic = "";   // 當前選中的音樂
let userPremium = false;  // 頁面需要呼叫 listenUser() 更新
let progress = 0;
let claimed = {};
let email = (localStorage.getItem("userEmail") || "").toLowerCase();

// ----------------------------
// UI：開啟音樂選單
// ----------------------------
function openMusicPanel() {
  buildMusicTable();
  document.getElementById('musicPanel').style.display = 'block';
}

// ----------------------------
// UI：建立音樂表格
// ----------------------------
function buildMusicTable() {
  const tbody = document.getElementById("musicTable");
  tbody.innerHTML = "";

  if (!userPremium) {
    tbody.innerHTML = `<tr><td colspan="3">❌ 需要購買高級通行證才能解鎖音樂</td></tr>`;
    return;
  }

  Object.entries(officialMusic).forEach(([lv, url]) => {
    const key = `${lv}_premium`;
    if (progress >= lv && claimed[key]) {
      tbody.innerHTML += `
        <tr>
          <td>官方音樂 Lv.${lv}</td>
          <td>官方</td>
          <td><input type="radio" name="musicSelect" value="${url}" ${selectedMusic===url?'checked':''}></td>
        </tr>`;
    }
  });

  customMusicLevels.forEach(lv => {
    const key = `${lv}_premium`;
    if (progress >= lv && claimed[key]) {
      tbody.innerHTML += `
        <tr>
          <td>自訂背景音樂 Lv.${lv}</td>
          <td>自訂</td>
          <td><input type="radio" name="musicSelect" value="custom_${lv}" ${selectedMusic===("custom_"+lv)?'checked':''}></td>
        </tr>`;
    }
  });

  if (!tbody.innerHTML) {
    tbody.innerHTML = `<tr><td colspan="3">🔒 尚未解鎖任何音樂</td></tr>`;
  }
}

// ----------------------------
// 保存選擇 & 播放
// ----------------------------
async function saveMusic() {
  const choice = document.querySelector("input[name='musicSelect']:checked");
  if (!choice) return alert("請先選擇一首音樂");
  const url = choice.value;

  selectedMusic = url;

  // 保存到 battlePass
  await db.collection("battlePass").doc(email).set({
    selectedMusic: selectedMusic
  }, { merge:true });

  playMusic(url);

  document.getElementById("musicPanel").style.display = "none";
}

// ----------------------------
// 播放器控制
// ----------------------------
function playMusic(url) {
  const player = document.getElementById("bgMusic");
  if (!player) return;

  if (url.startsWith("custom_")) {
    alert("這裡可做自訂音樂網址輸入功能");
  } else {
    player.src = url;
    player.style.display = "none"; // 隱藏但會自動播
    player.play().catch(err => {
      console.log("自動播放被瀏覽器阻擋:", err);
    });
  }
}

// ----------------------------
// 初始化：自動載入上次選的音樂
// ----------------------------
async function initMusic() {
  if (!email) return;

  const doc = await db.collection("battlePass").doc(email).get();
  if (doc.exists) {
    userPremium = doc.data().premium || false;
    progress = doc.data().progress || 0;
    claimed = doc.data().claimed || {};
    selectedMusic = doc.data().selectedMusic || "";

    if (selectedMusic) {
      playMusic(selectedMusic);
    }
  }
}
