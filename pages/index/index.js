// index.js
Page({
  data: {
    currentPhone: '',
    isDrawing: false,
    phoneModalVisible: false,
    resultModalVisible: false,
    prizesModalVisible: false,
    verificationModalVisible: false,
    participatedModalVisible: false,
    phoneInput: '',
    verificationCode: '',
    showPhoneError: false,
    showAlreadyParticipatedError: false,
    drawBtnText: '开始抽奖',
    currentPrizeId: 0,
    currentPrizeName: '',
    currentPrizeDescription: '',
    currentPrizeValue: '',
    currentPrizeIcon: '',
    userPrizes: [],
    participatedRecords: [],
    activePrizeId: 0 // 添加用于跟踪当前激活奖品的属性
  },

  // 奖品配置
  prizes: [
    { id: 1, name: '宇树Go2 Air机器狗', probability: 0, icon: 'fa-trophy' },
    { id: 2, name: '德龙咖啡机S3 Plus', probability: 0, icon: 'fa-gift' },
    { id: 3, name: '美的商用微波炉EM925F4T-SS', probability: 0.001, icon: 'fa-star' },
    { id: 4, name: '茶杯消毒柜28D-2', probability: 0.01, icon: 'fa-certificate' },
    { id: 5, name: '3000-200元优惠券', probability: 0.039, icon: 'fa-ticket' },
    { id: 6, name: '1000-50元优惠券', probability: 0.35, icon: 'fa-gift' },
    { id: 7, name: '300-20元优惠券', probability: 0.6, icon: 'fa-tag' },
    { id: 8, name: '谢谢参与', probability: 0, icon: 'fa-smile-o' }
  ],

  // 奖品详情
  prizeDetails: {
    1: { description: '宇树Go2 Air机器狗', value: '¥9997' },
    2: { description: '德龙咖啡机S3 Plus', value: '¥3390' },
    3: { description: '美的商用微波炉EM925F4T-SS', value: '¥1799' },
    4: { description: '茶杯消毒柜28D-2', value: '¥549' },
    5: { description: '3000-200元优惠券', value: '¥200' },
    6: { description: '1000-50元优惠券', value: '¥50' },
    7: { description: '300-20元优惠券', value: '¥20' },
    8: { description: '谢谢参与', value: '无' }
  },

  onLoad: function() {
    // 页面加载时执行
    console.log('页面加载，初始化抽奖按钮状态');
    
    // 清除可能存在的本地存储，确保可以重新测试
    wx.removeStorageSync('currentPhone');
    wx.removeStorageSync('userPrizes');
    
    // 确保所有用户都能看到开始抽奖按钮
    this.setData({
      currentPhone: '',
      drawBtnText: '开始抽奖',
      isDrawing: false
    });
    console.log('按钮状态设置为: 开始抽奖');
  },

  onShow: function() {
    // 页面显示时执行
    // 从本地存储获取手机号
    const savedPhone = wx.getStorageSync('currentPhone');
    if (savedPhone) {
      this.setData({ currentPhone: savedPhone });
      
      // 检查用户是否已参与抽奖
      if (this.hasParticipated(savedPhone)) {
        // 已参与，设置按钮为"已参加"状态
        this.setData({
          drawBtnText: '已参加',
          isDrawing: false
        });
        console.log('用户已参与抽奖，按钮状态设置为: 已参加');
      } else {
        // 未参与，设置按钮为"开始抽奖"状态
        this.setData({
          drawBtnText: '开始抽奖',
          isDrawing: false
        });
        console.log('用户未参与抽奖，按钮状态设置为: 开始抽奖');
      }
      
      this.loadUserPrizes();
    } else {
      // 未设置手机号，按钮状态为"开始抽奖"
      this.setData({
        drawBtnText: '开始抽奖',
        isDrawing: false
      });
      console.log('未设置手机号，按钮状态设置为: 开始抽奖');
    }
  },

  // 格式化日期
  formatDate: function(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 验证手机号
  validatePhone: function(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 检查是否已参与
  hasParticipated: function(phone) {
    const allUserPrizes = JSON.parse(wx.getStorageSync('userPrizes') || '[]');
    return allUserPrizes.some(item => item.phone === phone);
  },

  // 显示电话输入弹窗
  showPhoneModal: function() {
    this.setData({
      phoneInput: '',
      showPhoneError: false,
      showAlreadyParticipatedError: false,
      phoneModalVisible: true
    });
  },

  // 隐藏电话输入弹窗
  hidePhoneModal: function() {
    this.setData({ phoneModalVisible: false });
  },

  // 电话号码输入事件
  onPhoneInput: function(e) {
    this.setData({ phoneInput: e.detail.value });
  },

  // 显示抽奖结果
  showResult: function(prizeId) {
    console.log('显示抽奖结果:', prizeId);
    try {
      // 确保prizes数组和prizeDetails对象正确定义
      const prizes = this.prizes || [];
      const prizeDetails = this.prizeDetails || {};
      
      // 改进奖品查找逻辑，确保能找到所有奖品，特别是ID为8的奖品
      let prize = prizes.find(p => p && p.id === prizeId);
      let details = prizeDetails[prizeId];
      
      // 如果没找到，提供默认值
      if (!prize || !details) {
        // 为ID为8的谢谢参与奖品提供默认值
        if (prizeId === 8) {
          prize = { id: 8, name: '谢谢参与', probability: 0 };
          details = { description: '谢谢参与', value: '无' };
        } else {
          console.error('未找到奖品信息:', prizeId);
          wx.showToast({ title: '显示结果时发生错误', icon: 'none' });
          return;
        }
      }
      
      this.setData({
        currentPrizeId: prize.id,
        currentPrizeName: prize.name,
        currentPrizeDescription: details.description,
        currentPrizeValue: details.value,
        // 移除设置Font Awesome图标类名的代码
        resultModalVisible: true
      });
      
      // 保存中奖记录
      const prizeRecord = {
        phone: this.data.currentPhone,
        prizeId: prize.id,
        prizeName: prize.name,
        prizeDescription: details.description,
        prizeValue: details.value,
        // 移除保存Font Awesome图标类名的代码
        timestamp: new Date().toISOString(),
        formattedTime: this.formatDate(new Date().toISOString())
      };
      
      const allUserPrizes = JSON.parse(wx.getStorageSync('userPrizes') || '[]');
      allUserPrizes.push(prizeRecord);
      wx.setStorageSync('userPrizes', JSON.stringify(allUserPrizes));
      
      // 保存参与记录
      const currentTime = new Date().toISOString();
      const formattedTime = this.formatDate(currentTime);
      // 手机号脱敏处理
      const maskedPhone = this.data.currentPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      
      const participateRecord = {
        phone: maskedPhone,
        time: formattedTime
      };
      
      const participatedRecords = JSON.parse(wx.getStorageSync('participatedRecords') || '[]');
      participatedRecords.push(participateRecord);
      wx.setStorageSync('participatedRecords', JSON.stringify(participatedRecords));
      
      // 注释掉更新按钮状态的代码，允许用户继续测试
      // this.setData({ drawBtnText: '已抽奖' });
      
    } catch (error) {
      console.error('显示结果时出错:', error);
      wx.showToast({ title: '显示结果时发生错误', icon: 'none' });
    }
  },

  // 隐藏抽奖结果并退出页面
  hideResult: function() {
    this.setData({ resultModalVisible: false });
    // 退出当前页面
    wx.navigateBack();
  },

  // 显示奖品列表
  showPrizesModal: function() {
    this.loadUserPrizes();
    this.setData({ prizesModalVisible: true });
  },

  // 隐藏奖品列表
  hidePrizesModal: function() {
    this.setData({ prizesModalVisible: false });
  },

  // 加载用户奖品
  loadUserPrizes: function() {
    try {
      if (!this.data.currentPhone) {
        this.setData({ userPrizes: [] });
        return;
      }
      
      // 从本地存储获取所有中奖记录
      const allUserPrizes = JSON.parse(wx.getStorageSync('userPrizes') || '[]');
      console.log('所有中奖记录:', allUserPrizes);
      
      // 筛选当前用户的中奖记录
      let userPrizes = allUserPrizes.filter(item => item.phone === this.data.currentPhone);
      
      // 按时间倒序排序
      userPrizes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 确保每条记录都有格式化时间
      userPrizes = userPrizes.map(item => Object.assign({}, item, {
        formattedTime: item.formattedTime || this.formatDate(item.timestamp)
      }));
      
      this.setData({ userPrizes });
    } catch (error) {
      console.error('加载用户奖品时出错:', error);
      this.setData({ userPrizes: [] });
    }
  },

  // 渲染奖品列表
  prizesList: function() {
    // 这个函数在WXML中通过数据绑定自动处理
  },

  // 选择奖品
  selectPrize: function() {
    try {
      // 检查是否在测试模式
      const isTestMode = getApp().globalData.isTestMode || false;
      
      if (isTestMode) {
        // 测试模式：随机返回1-8的奖品ID
        return Math.floor(Math.random() * 8) + 1;
      }
      
      // 正常模式：基于概率选择奖品
      // 确保prizes数组正确定义，添加更严格的安全检查
      const prizes = Array.isArray(this.prizes) ? this.prizes : [];
      const validPrizes = prizes.filter(prize => prize && typeof prize.probability === 'number' && prize.probability > 0);
    
      if (validPrizes.length === 0) {
        // 如果没有有效奖品，默认返回"谢谢参与"
        return 8;
      }
    
      // 计算总概率
      const totalProbability = validPrizes.reduce((sum, prize) => sum + prize.probability, 0);
      
      // 生成随机数
      const random = Math.random();
      
      // 根据概率选择奖品
      let cumulativeProbability = 0;
      for (const prize of validPrizes) {
        cumulativeProbability += prize.probability / totalProbability;
        if (random <= cumulativeProbability) {
          return prize.id;
        }
      }
      
      // 如果由于精度问题没有选择到奖品，返回第一个有效奖品
      return validPrizes[0].id;
    } catch (error) {
      console.error('抽奖选择出错:', error);
      // 出错时默认返回"谢谢参与"
      return 8;
    }
  },

  // 开始抽奖动画
  startDrawAnimation: function(targetPrizeId) {
    let currentIndex = 1;
    let speed = 100; // 初始速度
    let isAccelerating = true;
    let isDecelerating = false;
    let accelerationCount = 0;
    let constantCount = 0;
    
    // 确保最终停在目标奖品
    const totalSteps = 100 + (8 - (targetPrizeId - 1)) % 8; // 多转几圈再停止
    let step = 0;
    
    const animate = () => {
      if (step >= totalSteps) {
        // 动画结束，显示结果
        setTimeout(() => {
          this.showResult(targetPrizeId);
          this.setData({ 
            isDrawing: false,
            activePrizeId: 0 // 重置激活状态
          });
        }, 500);
        return;
      }
      
      // 使用数据绑定更新当前激活的奖品
      this.setData({ activePrizeId: currentIndex });
      
      // 更新当前奖品索引
      currentIndex = currentIndex % 8 + 1;
      step++;
      
      // 动画阶段控制
      if (isAccelerating) {
        accelerationCount++;
        if (accelerationCount >= 10) {
          isAccelerating = false;
        } else {
          speed = Math.max(30, 100 - accelerationCount * 7);
        }
      } else if (!isDecelerating) {
        constantCount++;
        if (constantCount >= 60) {
          isDecelerating = true;
        }
      } else {
        speed += 5;
      }
      
      // 继续动画
      setTimeout(animate, speed);
    };
    
    // 开始动画
    animate();
  },

  // 移除不兼容的DOM操作函数
  // 开始抽奖
  startDraw: function() {
    if (this.data.isDrawing) {
      return;
    }
    
    this.setData({ isDrawing: true });
    
    // 选择奖品
    const targetPrizeId = this.selectPrize();
    
    // 开始动画
    this.startDrawAnimation(targetPrizeId);
  },

  // 提交手机号
  submitPhoneNumber: function() {
    const phone = this.data.phoneInput;
    
    // 验证手机号
    if (!this.validatePhone(phone)) {
      this.setData({ showPhoneError: true, showAlreadyParticipatedError: false });
      return;
    }
    
    // 检查是否已参与
    if (this.hasParticipated(phone)) {
      this.setData({ showAlreadyParticipatedError: true, showPhoneError: false });
      return;
    }
    
    // 保存手机号
    this.setData({ 
      currentPhone: phone,
      phoneModalVisible: false 
    });
    wx.setStorageSync('currentPhone', phone);
    
    // 开始抽奖
    this.startDraw();
  },

  // 测试显示结果
  testShowResult: function() {
    // 随机选择一个奖品
    const randomPrizeId = Math.floor(Math.random() * 8) + 1;
    this.showResult(randomPrizeId);
  },

  // 测试抽奖
  testDraw: function() {
    // 设置测试模式
    getApp().globalData.isTestMode = true;
    this.startDraw();
  },

  // 抽奖按钮点击事件
  onDrawBtnClick: function() {
    console.log('抽奖按钮被点击！当前按钮文本:', this.data.drawBtnText, '抽奖中状态:', this.data.isDrawing);
    
    // 如果按钮状态为"已参加"，直接提示用户
    if (this.data.drawBtnText === '已参加') {
      wx.showToast({ title: '您已参与过抽奖', icon: 'none' });
      console.log('按钮已显示"已参加"，提示用户');
      return;
    }
    
    // 抽奖中状态，忽略点击
    if (this.data.isDrawing) {
      console.log('正在抽奖中，忽略点击');
      return;
    }
    
    console.log('准备处理抽奖...');
    
    // 未设置手机号，显示电话输入弹窗
    if (!this.data.currentPhone) {
      console.log('未设置手机号，显示电话输入弹窗');
      this.showPhoneModal();
    } else {
      // 已设置手机号，再次检查是否已参与抽奖（防止状态不一致）
      console.log('已设置手机号，检查是否已参与抽奖');
      if (this.hasParticipated(this.data.currentPhone)) {
        // 更新按钮状态为"已参加"
        this.setData({
          drawBtnText: '已参加'
        });
        wx.showToast({ title: '您已参与过抽奖', icon: 'none' });
        console.log('用户已参与抽奖，更新按钮状态为"已参加"');
        return;
      }
      // 直接开始抽奖
      this.startDraw();
    }
  },
  
  // 显示验证码弹窗
  showVerificationModal: function() {
    this.setData({
      verificationModalVisible: true,
      verificationCode: ''
    });
  },
  
  // 隐藏验证码弹窗
  hideVerificationModal: function() {
    this.setData({
      verificationModalVisible: false,
      verificationCode: ''
    });
  },
  
  // 处理验证码输入
  onVerificationInput: function(e) {
    this.setData({
      verificationCode: e.detail.value
    });
  },
  
  // 验证验证码
  verifyCode: function() {
    const { verificationCode } = this.data;
    
    if (verificationCode.toLowerCase() === 'dms') {
      // 验证码正确，加载并显示参与记录
      this.loadParticipatedRecords();
      this.setData({
        verificationModalVisible: false,
        participatedModalVisible: true
      });
    } else {
      // 验证码错误提示
      wx.showToast({
        title: '验证码错误',
        icon: 'none',
        duration: 2000
      });
    }
  },
  
  // 加载参与记录
  loadParticipatedRecords: function() {
    try {
      // 从本地存储获取参与记录
      const records = JSON.parse(wx.getStorageSync('participatedRecords') || '[]');
      
      // 如果没有记录，可以添加一些初始的模拟数据作为示例
      const displayRecords = records.length > 0 ? records : [
        { phone: '138****1234', time: '2023-10-29 10:30:45' },
        { phone: '139****5678', time: '2023-10-29 11:45:30' },
        { phone: '137****9012', time: '2023-10-29 13:20:15' }
      ];
      
      this.setData({
        participatedRecords: displayRecords
      });
    } catch (error) {
      console.error('加载参与记录时出错:', error);
      this.setData({
        participatedRecords: []
      });
    }
  },
  
  // 隐藏已参加记录弹窗
  hideParticipatedModal: function() {
    this.setData({
      participatedModalVisible: false
    });
  }
});