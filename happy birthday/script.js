document.addEventListener('DOMContentLoaded', () => {

  // ==================== 1. 背景音乐播放器 ====================
  const musicPlayer = document.getElementById('music-player');
  const vinyl = document.getElementById('vinyl');
  const bgm = document.getElementById('bgm');
  let isPlaying = false;

  if (musicPlayer && vinyl && bgm) {
    musicPlayer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isPlaying) {
        bgm.pause();
        vinyl.classList.remove('playing');
        isPlaying = false;
      } else {
        bgm.play().then(() => {
          vinyl.classList.add('playing');
          isPlaying = true;
        }).catch(err => {
          console.error("音乐播放失败:", err);
          alert("播放失败！请检查 assets/happy_birthday.mp3 文件路径是否准确。");
        });
      }
    });
  }

  // ==================== 2. 吹蜡烛 / 点击吹灭逻辑 ====================
  const cakeContainer = document.getElementById('cake-container');
  const candleImg = document.getElementById('candle-img');
  const modalLetter = document.getElementById('modal-letter');
  const iconBlindbox = document.getElementById('icon-blindbox'); // 在头部统一声明

  let isExtinguished = false;
  let audioContext, analyser, microphone, stream;

  function extinguishCandle() {
    if (isExtinguished) return;
    isExtinguished = true;

    stopMic(); // 停止麦克风

    // 1. 换成熄灭蜡烛图
    if (candleImg) {
      candleImg.src = 'assets/cake/candle_off_2.png';
    }

    // 2. 喷发五彩礼花
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
    }

    // 3. 蜡烛淡出向上飘走
    setTimeout(() => {
      if (candleImg) candleImg.classList.add('fade-out');
    }, 400);

    // 4. 弹出信封/祝福弹窗
    setTimeout(() => {
      if (modalLetter) modalLetter.classList.add('active');
    }, 1000);
  }

  // 麦克风吹气检测
  async function startMic() {
    if (audioContext || isExtinguished) return;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();

      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 512;
      microphone.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function detectBlow() {
        if (isExtinguished) return;
        analyser.getByteFrequencyData(dataArray);

        let lowFreqSum = 0;
        const lowFreqCutoff = Math.floor(bufferLength * 0.15);
        for (let i = 0; i < lowFreqCutoff; i++) {
          lowFreqSum += dataArray[i];
        }

        if ((lowFreqSum / lowFreqCutoff) > 35) {
          extinguishCandle();
        } else {
          requestAnimationFrame(detectBlow);
        }
      }
      detectBlow();
    } catch (err) {
      console.warn("麦克风权限未开启（依然支持直接点击吹灭）");
    }
  }

  function stopMic() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (audioContext && audioContext.state !== 'closed') audioContext.close();
  }

  // 页面全局点击启动麦克风
  document.body.addEventListener('click', () => {
    if (!isExtinguished) startMic();
  });

  // 点击蛋糕直接熄灭
  if (cakeContainer) {
    cakeContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      extinguishCandle();
    });
  }

  // ==================== 3. 关闭信封 & 解锁盲盒 ====================
  const btnCloseLetter = document.getElementById('btn-close-letter');
  const closeLetter = document.getElementById('close-letter');

  const unlockBlindbox = () => {
    if (modalLetter) modalLetter.classList.remove('active');
    if (iconBlindbox) {
      iconBlindbox.classList.remove('locked');
      iconBlindbox.classList.add('unlocked');
    }
  };

  btnCloseLetter?.addEventListener('click', unlockBlindbox);
  closeLetter?.addEventListener('click', unlockBlindbox);

  // ==================== 4. 生日盲盒抽取逻辑 (不重复保底版) ====================
  const modalBlindbox = document.getElementById('modal-blindbox');
  const closeBlindbox = document.getElementById('close-blindbox');
  const btnDrawBox = document.getElementById('btn-draw-box');
  const boxShake = document.getElementById('box-shake');
  const blindboxResult = document.getElementById('blindbox-result');

  // 原始盲盒礼物池（19个礼物）
  const originalWishesList = [
    "🎉 抽中：一套护肤品献给世界上超级无敌帅的宝宝酱！",
    "🎉 抽中：一次让我这个胆小如鼠一起玩密室逃脱的机会",
    "🎉 抽中：一起看电影，随机你来选~恐怖片也没问题~",
    "🎉 抽中：一次提任何任意小要求的机会~限制你懂的噢~",
    "🎉 抽中：两张请吃饭的券~我请~我请~~~~",
    "🎉 抽中：一箱零食",
    "🎉 抽中：一束花",
    "🎉 抽中：润唇膏",
    "🎉 抽中：一起做一次饭，如果我是整租的话~~~",
    "🎉 抽中：一次周末陪伴券，无条件的噢~你想让我陪做什么都可以噢",
    "🎉 抽中：一起拍一套写真，回中国可以的话~",
    "🎉 抽中：一起拍一次合照",
    "🎉 抽中：一双情侣鞋",
    "🎉 抽中：蓝牙耳机",
    "🎉 抽中：一套情侣睡衣，这样就拥有一样的啦~",
    "🎉 抽中：一个毛茸茸的毛毯~冬天暖呼呼的~",
    "🎉 抽中：一盒你最爱吃的巧克力！",
    "🎉 抽中：一起出去野炊~找一个好天气一起吃去~",
    "🎉 抽中：一盏可爱的小夜灯！"
  ];

  // 创建一个未抽取的剩余礼物池（浅拷贝）
  let remainingWishes = [...originalWishesList];

  // 打开盲盒 Modal
  if (iconBlindbox) {
    iconBlindbox.addEventListener('click', () => {
      if (iconBlindbox.classList.contains('unlocked')) {
        modalBlindbox?.classList.add('active');
      } else {
        alert("请先吹灭蛋糕上的蜡烛，解锁生日惊喜哦！");
      }
    });
  }

  // 关闭 Modal
  closeBlindbox?.addEventListener('click', () => {
    modalBlindbox?.classList.remove('active');
  });

  // 抽奖过程动画与不重复抽取逻辑
  if (btnDrawBox && boxShake && blindboxResult) {
    btnDrawBox.addEventListener('click', () => {

      // 如果所有礼物已经抽完
      if (remainingWishes.length === 0) {
        blindboxResult.innerText = "✨ 哇！所有的生日惊喜已经被你全部抽完啦！要好好兑换哦~";
        blindboxResult.classList.add('has-result');
        btnDrawBox.innerText = "🎉 惊喜已全集齐";
        btnDrawBox.disabled = true;
        btnDrawBox.style.opacity = '0.6';
        return;
      }

      // 禁用按钮防止重复触发
      btnDrawBox.disabled = true;
      btnDrawBox.style.opacity = '0.7';
      
      // 触发摇晃动画
      boxShake.classList.add('shaking');
      blindboxResult.classList.remove('has-result');
      blindboxResult.innerText = "🎁 正在疯狂摇晃盲盒中...";

      setTimeout(() => {
        // 停止摇晃
        boxShake.classList.remove('shaking');
        
        // 从剩余礼物池中随机选出一个索引
        const randomIndex = Math.floor(Math.random() * remainingWishes.length);
        
        // 提取该礼物，并从剩余池中彻底剔除
        const drawnWish = remainingWishes.splice(randomIndex, 1)[0];

        // 显示抽中结果
        blindboxResult.innerText = drawnWish;
        blindboxResult.classList.add('has-result');
        
        // 恢复按钮状态
        btnDrawBox.disabled = false;
        btnDrawBox.style.opacity = '1';

        // 按钮上显示剩余未抽个数
        if (remainingWishes.length > 0) {
          btnDrawBox.innerText = `✨ 开启下一个盲盒 (还剩 ${remainingWishes.length} 个) ✨`;
        } else {
          btnDrawBox.innerText = "✨ 点击查看全部集齐提示 ✨";
        }

        // 喷发礼花
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }, 800);
    });
  }

}); // <-- 补充闭合括号