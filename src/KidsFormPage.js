import React, { useState, useEffect, useCallback } from 'react';
import * as ElementReact from 'element-react';
import 'element-theme-default/lib/index.css';
import './KidsFormPage.css'; // Import component-specific CSS
import AsyncValidator from 'async-validator';
import { Link } from 'react-router-dom';
import CustomDatePicker from './components/CustomDatePicker';

// Polyfill to fix potential issues with ElementReact
window.AsyncValidator = AsyncValidator;

const RANDOM_QUESTION_POOL = [
  '是否喜欢听故事',
  '小名',
  '喜欢吃的食物',
  '去过哪些城市',
  '是否喜欢听故事',
  '一天睡眠几小时',
  '孩子的身高',
  '孩子日常排便时间',
  '是否能独立穿衣服',
  '日常照顾人',
  '喜欢吃什么水果',
  '是否能独立吃饭'
];

function KidsFormPage({ userInfo, onLogout }) {
  // Form state
  const [form, setForm] = useState({
    childIdType: '居民身份证',
    contactPhone: '',
    relationship: '',
    childIdNumber: '',
    childName: '',
    childGender: '',
    childBirthDate: null,
    ageGroup: '',
    childResidence: '',
    fatherIdType: '',
    fatherName: '',
    fatherIdNumber: '',
    motherIdType: '',
    motherName: '',
    motherIdNumber: '',
    randomQuestion1: '',
    randomQuestion2: '',
    randomQuestion3: '',
    captchaImage: '',
    smsCode: ''
  });
  
  // Form fields from cwikids.json
  const [formFields, setFormFields] = useState({
    line1: {
      "幼儿证件类型": "居民身份证",
      "联系手机": "+86",
      "幼儿与在沪房产持有人关系": "请选择"
    },
    line2: {
      "幼儿证件号": "尾号字母必须为大写",
      "幼儿姓名": "请输入",
      "幼儿性别": "自动选择"
    },
    line3: {
      "幼儿出生日期": "自动填写",
      "学龄段": "自动选择",
      "幼儿户籍所在地": "请选择"
    },
    line4: {
      "父亲证件类型": "请选择",
      "父亲姓名": "请输入",
      "父亲证件号": "请输入"
    },
    line5: {
      "母亲证件类型": "请选择",
      "母亲姓名": "请输入",
      "母亲证件号": "请输入"
    },
    line6: {
      "图形验证": "图形验证码",
      "短信验证码": "4位验证码"
    }
  });
  
  // Load cwikids.json data
  useEffect(() => {
    const loadFormFields = async () => {
      try {
        const response = await fetch('/cwikids.json');
        const data = await response.json();
        setFormFields(data);
      } catch (error) {
        console.error('Error loading form fields:', error);
      }
    };
    
    loadFormFields();
  }, []);
  
  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Form rules
  // eslint-disable-next-line no-unused-vars
  const rules = {
    childIdNumber: [
      { required: true, message: '请输入幼儿证件号', trigger: 'blur' },
      { max: 18, message: '长度不能超过18个字符', trigger: 'blur' }
    ],
    childName: [
      { required: true, message: '请输入幼儿姓名', trigger: 'blur' },
      { max: 10, message: '长度不能超过10个字符', trigger: 'blur' }
    ],
    contactPhone: [
      { required: true, message: '请输入联系手机', trigger: 'blur' },
      { pattern: /^\d{11}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ],
    fatherIdNumber: [
      { required: true, message: '请输入父亲证件号', trigger: 'blur' }
    ]
  };
  
  // Add state for math captcha
  const [mathCaptcha, setMathCaptcha] = useState({
    question: '',
    answer: '',
    image: ''
  });
  const [randomQuestions, setRandomQuestions] = useState([]);

  // Function to generate captcha image
  const generateCaptchaImage = (text) => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 160;
    canvas.height = 46;
    
    // Fill background with random light color
    const bgColor = `hsl(${Math.random() * 360}, 30%, 90%)`;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise (dots)
    ctx.fillStyle = '#888';
    for (let i = 0; i < 80; i++) {
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        1
      );
    }
    
    // Add some random lines for noise
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    
    // Set text style
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add slight rotation for security
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((Math.random() * 8 - 4) * Math.PI / 180);
    
    // Draw the text
    ctx.fillText(text, 0, 0);
    
    // Reset transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  };

  // Memoize the generateMathCaptcha function to prevent infinite loop
  const generateMathCaptcha = useCallback(() => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer;
    
    // Generate numbers based on operation for appropriate difficulty
    // All numbers are positive now
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 30) + 1; // 1 to 30
        num2 = Math.floor(Math.random() * 30) + 1; // 1 to 30
        answer = num1 + num2;
        break;
      case '-':
        // For subtraction, we'll allow any order, but both numbers are positive
        num1 = Math.floor(Math.random() * 20) + 1; // 1 to 20
        num2 = Math.floor(Math.random() * 20) + 1; // 1 to 20
        // Allow negative answers - first number can be smaller than second
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1; // 1 to 10
        num2 = Math.floor(Math.random() * 10) + 1; // 1 to 10
        answer = num1 * num2;
        break;
      default:
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 + num2;
    }
    
    // Format the question
    const question = `${num1} ${operation} ${num2} = ?`;
    
    // Generate a canvas with the captcha
    const captchaImage = generateCaptchaImage(question);
    
    setMathCaptcha({
      question,
      answer: answer.toString(),
      image: captchaImage
    });
    
    // Reset the captcha input field
    setForm(prevForm => ({
      ...prevForm,
      captchaImage: ''
    }));
    
    return { question, answer, image: captchaImage };
  }, []);
  
  // Generate a captcha when component mounts
  useEffect(() => {
    generateMathCaptcha();
  }, [generateMathCaptcha]);
  
  // Validate math captcha answer
  const validateMathCaptcha = (value) => {
    // Simply compare the user's answer with the expected answer
    return value === mathCaptcha.answer;
  };

  // Refresh math captcha
  const refreshMathCaptcha = () => {
    // Clear any existing validation classes
    const captchaInput = document.querySelector('input[name="captchaImage"]');
    if (captchaInput) {
      captchaInput.classList.remove('captcha-validated');
      captchaInput.classList.remove('captcha-error');
    }
    // Generate new captcha
    generateMathCaptcha();
    setRandomQuestions(prevQuestions => {
      const shuffled = [...RANDOM_QUESTION_POOL].sort(() => Math.random() - 0.5);
      const nextQuestions = shuffled.slice(0, 3);
      if (
        prevQuestions.length === 3 &&
        prevQuestions.every((question, idx) => question === nextQuestions[idx])
      ) {
        const reshuffled = [...RANDOM_QUESTION_POOL].sort(() => Math.random() - 0.5);
        return reshuffled.slice(0, 3);
      }
      return nextQuestions;
    });
    setForm(prevForm => ({
      ...prevForm,
      randomQuestion1: '',
      randomQuestion2: '',
      randomQuestion3: ''
    }));
  };

  const generateRandomQuestions = useCallback(() => {
    const shuffled = [...RANDOM_QUESTION_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  useEffect(() => {
    setRandomQuestions(generateRandomQuestions());
  }, [generateRandomQuestions]);

  // Handle form input changes
  const handleChange = (key, value) => {
    const newForm = {
      ...form,
      [key]: value
    };
    
    // Auto-validate math captcha immediately when user types
    if (key === 'captchaImage' && value) {
      if (value === mathCaptcha.answer) {
        // Provide visual feedback for correct answer
        setTimeout(() => {
          const captchaInput = document.querySelector('input[name="captchaImage"]');
          if (captchaInput) {
            captchaInput.classList.add('captcha-validated');
            captchaInput.classList.remove('captcha-error');
          }
          ElementReact.Message.success('验证码正确');
        }, 200);
      } else if (value.length >= mathCaptcha.answer.length) {
        // Only show error if user has typed enough characters
        setTimeout(() => {
          const captchaInput = document.querySelector('input[name="captchaImage"]');
          if (captchaInput) {
            captchaInput.classList.add('captcha-error');
            captchaInput.classList.remove('captcha-validated');
          }
        }, 200);
      }
    }
    
    // Auto-fill based on ID number if it's a valid ID card number
    if (key === 'childIdNumber' && value && value.length === 18 && /^[0-9X]{18}$/.test(value)) {
      // Extract birth date from ID (format: YYYYMMDD is positions 7-14)
      const birthDateStr = value.substring(6, 14);
      const year = birthDateStr.substring(0, 4);
      const month = birthDateStr.substring(4, 6);
      const day = birthDateStr.substring(6, 8);
      
      // Create Date object
      const birthDate = new Date(`${year}-${month}-${day}`);
      
      // Extract gender from ID (odd = male, even = female)
      const genderCode = parseInt(value.charAt(16)) % 2;
      const gender = genderCode === 1 ? '男' : '女';
      
      // Calculate age and determine age group
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      let ageGroup = '';
      
      if (age < 3) {
        ageGroup = '托班';
      } else {
        ageGroup = '小班';
      }
      
      // Update form with extracted data
      newForm.childGender = gender;
      newForm.childBirthDate = birthDate;
      newForm.ageGroup = ageGroup;
      
      // Show success notification for auto-fill
      setTimeout(() => {
        ElementReact.Message.success('已根据身份证号自动填写性别、出生日期和学龄段');
      }, 200);
    }
    
    setForm(newForm);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const errors = {};
    if (!form.childIdNumber) errors.childIdNumber = '请输入幼儿证件号';
    if (!form.childName) errors.childName = '请输入幼儿姓名';
    if (!form.contactPhone) errors.contactPhone = '请输入联系手机';
    else if (!/^\d{11}$/.test(form.contactPhone)) errors.contactPhone = '请输入正确的手机号码';
    if (!form.fatherIdNumber) errors.fatherIdNumber = '请输入父亲证件号';
    
    // Validate captcha
    if (!form.captchaImage) {
      errors.captchaImage = '请输入验证码';
    } else if (!validateMathCaptcha(form.captchaImage)) {
      errors.captchaImage = '验证码错误';
      // Generate a new captcha if the answer was wrong
      refreshMathCaptcha();
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        setDialogVisible(true);
        console.log('Form submitted:', form);
      }, 1500);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setForm({
      childIdType: '居民身份证',
      contactPhone: '',
      relationship: '',
      childIdNumber: '',
      childName: '',
      childGender: '',
      childBirthDate: null,
      ageGroup: '',
      childResidence: '',
      fatherIdType: '',
      fatherName: '',
      fatherIdNumber: '',
      motherIdType: '',
      motherName: '',
      motherIdNumber: '',
      randomQuestion1: '',
      randomQuestion2: '',
      randomQuestion3: '',
      captchaImage: '',
      smsCode: ''
    });
    setFormErrors({});
    
    ElementReact.Message({
      message: '表单已重置',
      type: 'info',
      duration: 2000
    });
  };
  
  // Handle success dialog confirm
  const handleSuccessConfirm = () => {
    setDialogVisible(false);
    
    ElementReact.Message({
      message: '表单提交成功',
      type: 'success',
      duration: 3000
    });
  };
  
  // Auto-fill the form with test data
  const loadTestData = () => {
    const testData = {
      childName: "测试姓名",
      childGender: "男",
      childBirthDate: new Date('2019-01-15'),
      childNation: "汉族",
      childNationality: "中国",
      childAddress: "测试地址",
      guardianName: "测试监护人",
      guardianPhone: "13800138000",
      guardianRelation: "父亲",
      emergencyContact: "测试紧急联系人",
      emergencyPhone: "13900139000"
    };
    setForm(testData);
    setFormErrors({});
    setTimeout(() => {
      ElementReact.Message.success('测试数据已载入');
    }, 200);
  };
  
  return (
    <div className="form-fill-container">
      <header className="form-header">
        <h1>幼儿与在沪房表单</h1>
        {userInfo && (
          <div className="user-info">
            <span>欢迎, {userInfo.username || '用户'}</span>
            <button className="logout-btn" onClick={onLogout}>退出登录</button>
          </div>
        )}
      </header>
      
      <div className="form-content">
        <div className="form-tools">
          <button className="tool-btn" onClick={loadTestData}>加载测试数据</button>
          <Link to="/direct/kids" className="form-link" target="_blank">直接访问幼儿表单</Link>
        </div>
        
        {/* Display form errors if any */}
        {Object.keys(formErrors).length > 0 && (
          <div className="form-error">
            {Object.values(formErrors)[0]}
          </div>
        )}
        
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">幼儿信息</h2>

            <div className="form-row">
              <div className="form-group">
                <label>幼儿证件类型</label>
                <ElementReact.Select
                  value={form.childIdType}
                  placeholder={formFields.line1["幼儿证件类型"]}
                  onChange={value => handleChange('childIdType', value)}
                >
                  <ElementReact.Select.Option label="居民身份证" value="居民身份证" />
                  <ElementReact.Select.Option label="护照" value="护照" />
                </ElementReact.Select>
              </div>

              <div className="form-group">
                <label>幼儿姓名</label>
                <ElementReact.Input
                  value={form.childName}
                  placeholder={formFields.line2["幼儿姓名"]}
                  onChange={value => handleChange('childName', value)}
                />
                {formErrors.childName && <div className="error-message">{formErrors.childName}</div>}
              </div>

              <div className="form-group">
                <label>幼儿户籍所在地</label>
                <ElementReact.Select
                  value={form.childResidence}
                  placeholder={formFields.line3["幼儿户籍所在地"]}
                  onChange={value => handleChange('childResidence', value)}
                >
                  <ElementReact.Select.Option label="上海市" value="上海市" />
                  <ElementReact.Select.Option label="北京市" value="北京市" />
                  <ElementReact.Select.Option label="广东省" value="广东省" />
                  <ElementReact.Select.Option label="其他" value="其他" />
                </ElementReact.Select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>幼儿证件号</label>
                <ElementReact.Input
                  value={form.childIdNumber}
                  placeholder={formFields.line2["幼儿证件号"]}
                  onChange={value => handleChange('childIdNumber', value)}
                />
                {formErrors.childIdNumber && <div className="error-message">{formErrors.childIdNumber}</div>}
              </div>

              <div className="form-group">
                <label>幼儿性别</label>
                <ElementReact.Select
                  value={form.childGender}
                  placeholder={formFields.line2["幼儿性别"]}
                  onChange={value => handleChange('childGender', value)}
                >
                  <ElementReact.Select.Option label="男" value="男" />
                  <ElementReact.Select.Option label="女" value="女" />
                  <ElementReact.Select.Option label="未知" value="未知" />
                </ElementReact.Select>
              </div>

              <div className="form-group">
                <label>幼儿与在沪房产持有人关系</label>
                <ElementReact.Select
                  value={form.relationship}
                  placeholder={formFields.line1["幼儿与在沪房产持有人关系"]}
                  onChange={value => handleChange('relationship', value)}
                >
                  <ElementReact.Select.Option label="父亲" value="父亲" />
                  <ElementReact.Select.Option label="母亲" value="母亲" />
                </ElementReact.Select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>幼儿出生日期</label>
                <CustomDatePicker
                  value={form.childBirthDate}
                  placeholder={formFields.line3["幼儿出生日期"]}
                  onChange={value => handleChange('childBirthDate', value)}
                  format="yyyy-MM-dd"
                  isShowTime={false}
                  selectionMode="day"
                  firstDayOfWeek={1}
                  className="full-width-datepicker"
                />
              </div>

              <div className="form-group">
                <label>学龄段</label>
                <ElementReact.Select
                  value={form.ageGroup}
                  placeholder={formFields.line3["学龄段"]}
                  onChange={value => handleChange('ageGroup', value)}
                >
                  <ElementReact.Select.Option label="托班" value="托班" />
                  <ElementReact.Select.Option label="小班" value="小班" />
                </ElementReact.Select>
              </div>

              <div className="form-group">
                {/* Empty cell for layout consistency */}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">幼儿父亲信息</h2>
            <div className="form-row">
              <div className="form-group">
                <label>父亲证件类型</label>
                <ElementReact.Select
                  value={form.fatherIdType}
                  placeholder={formFields.line4["父亲证件类型"]}
                  onChange={value => handleChange('fatherIdType', value)}
                >
                  <ElementReact.Select.Option label="居民身份证" value="居民身份证" />
                  <ElementReact.Select.Option label="护照" value="护照" />
                </ElementReact.Select>
              </div>

              <div className="form-group">
                <label>父亲姓名</label>
                <ElementReact.Input
                  value={form.fatherName}
                  placeholder={formFields.line4["父亲姓名"]}
                  onChange={value => handleChange('fatherName', value)}
                />
              </div>

              <div className="form-group">
                <label>父亲证件号</label>
                <ElementReact.Input
                  value={form.fatherIdNumber}
                  placeholder={formFields.line4["父亲证件号"]}
                  onChange={value => handleChange('fatherIdNumber', value)}
                />
                {formErrors.fatherIdNumber && <div className="error-message">{formErrors.fatherIdNumber}</div>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">幼儿母亲信息</h2>
            <div className="form-row">
              <div className="form-group">
                <label>母亲证件类型</label>
                <ElementReact.Select
                  value={form.motherIdType}
                  placeholder={formFields.line5["母亲证件类型"]}
                  onChange={value => handleChange('motherIdType', value)}
                >
                  <ElementReact.Select.Option label="居民身份证" value="居民身份证" />
                  <ElementReact.Select.Option label="护照" value="护照" />
                </ElementReact.Select>
              </div>

              <div className="form-group">
                <label>母亲姓名</label>
                <ElementReact.Input
                  value={form.motherName}
                  placeholder={formFields.line5["母亲姓名"]}
                  onChange={value => handleChange('motherName', value)}
                />
              </div>

              <div className="form-group">
                <label>母亲证件号</label>
                <ElementReact.Input
                  value={form.motherIdNumber}
                  placeholder={formFields.line5["母亲证件号"]}
                  onChange={value => handleChange('motherIdNumber', value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">幼儿相关信息</h2>
            <div className="form-row">
              <div className="form-group">
                <label>{randomQuestions[0] || '问题 1'}</label>
                <ElementReact.Input
                  value={form.randomQuestion1}
                  placeholder="请输入"
                  onChange={value => handleChange('randomQuestion1', value)}
                />
              </div>

              <div className="form-group">
                <label>{randomQuestions[1] || '问题 2'}</label>
                <ElementReact.Input
                  value={form.randomQuestion2}
                  placeholder="请输入"
                  onChange={value => handleChange('randomQuestion2', value)}
                />
              </div>

              <div className="form-group">
                <label>{randomQuestions[2] || '问题 3'}</label>
                <ElementReact.Input
                  value={form.randomQuestion3}
                  placeholder="请输入"
                  onChange={value => handleChange('randomQuestion3', value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>联系手机</label>
                <ElementReact.Input
                  value={form.contactPhone}
                  placeholder={formFields.line1["联系手机"]}
                  onChange={value => handleChange('contactPhone', value)}
                />
                {formErrors.contactPhone && <div className="error-message">{formErrors.contactPhone}</div>}
              </div>

              <div className="form-group">
                <label>短信验证</label>
                <ElementReact.Input
                  value={form.smsCode}
                  placeholder="请输入4位验证码"
                  onChange={value => handleChange('smsCode', value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </div>

              <div className="form-group">
                <label>验证码</label>
                <div className="captcha-container">
                  <ElementReact.Input
                    value={form.captchaImage}
                    placeholder="请输入计算结果"
                    onChange={value => handleChange('captchaImage', value)}
                    style={{ width: '130px' }}
                    name="captchaImage"
                    className={
                      form.captchaImage === mathCaptcha.answer && form.captchaImage !== ''
                        ? 'captcha-validated'
                        : formErrors.captchaImage
                          ? 'captcha-error'
                          : ''
                    }
                  />
                  <div className="captcha-image">
                    {mathCaptcha.image && (
                      <img
                        src={mathCaptcha.image}
                        alt="数学验证码"
                        style={{
                          height: '46px',
                          maxWidth: '160px',
                          borderRadius: '4px'
                        }}
                      />
                    )}
                  </div>
                  <ElementReact.Button
                    type="text"
                    icon="refresh"
                    style={{ marginLeft: '5px' }}
                    onClick={refreshMathCaptcha}>
                    获取验证码
                  </ElementReact.Button>
                </div>
                {formErrors.captchaImage && <div className="error-message">{formErrors.captchaImage}</div>}
              </div>

              <div className="form-group">
                {/* Empty cell for layout consistency */}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <ElementReact.Button type="primary" nativeType="submit" loading={loading}>提交</ElementReact.Button>
            <ElementReact.Button onClick={resetForm}>重置</ElementReact.Button>
          </div>
        </form>
      </div>
      
      {/* Success Dialog */}
      <ElementReact.Dialog
        title="提交成功"
        visible={dialogVisible}
        onCancel={() => setDialogVisible(false)}
      >
        <ElementReact.Dialog.Body>
          <p>幼儿信息已成功提交！</p>
        </ElementReact.Dialog.Body>
        <ElementReact.Dialog.Footer>
          <ElementReact.Button type="primary" onClick={handleSuccessConfirm}>确定</ElementReact.Button>
        </ElementReact.Dialog.Footer>
      </ElementReact.Dialog>
    </div>
  );
}

export default KidsFormPage; 