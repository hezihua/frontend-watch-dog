'use client';

import { useState } from 'react';
import { Input, message, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import axios from 'axios';

enum ActionType {
  Login = 0,
  Register = 1,
}

export default function LoginPage() {
  const router = useRouter();
  const [type, setType] = useState(ActionType.Login);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    user: '',
    pwd: '',
  });

  const formChange = (val: string, key: string) => {
    setForm({
      ...form,
      [key]: val,
    });
  };

  const showAction = (actionType: ActionType) => {
    setShow(true);
    setType(actionType);
    setForm({
      user: '',
      pwd: '',
    });
  };

  const toLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', {
        account: form.user,
        password: form.pwd,
      });

      if (response.data.code === 1000) {
        message.success('登录成功');
        
        // 检查是否有保存的跳转地址
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectPath);
        } else {
          router.push('/');
        }
        router.refresh();
      } else {
        message.error(response.data.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const toSubmit = async () => {
    try {
      const { user, pwd } = form;
      const reg = /^[a-zA-Z0-9]{6,10}$/;

      if (!user || !pwd) {
        return message.error('账号和密码不能为空');
      }

      if (!reg.test(user) || !reg.test(pwd)) {
        return message.error('请输入长度6~10，只包含数字和字母的账号和密码');
      }

      if (type === ActionType.Login) {
        await toLogin();
      } else {
        setLoading(true);
        const response = await axios.post('/api/auth/register', {
          account: form.user,
          password: form.pwd,
        });

        if (response.data.code === 1000) {
          message.success('注册成功');
          Modal.confirm({
            content: '立即登录？',
            onOk: async () => {
              await toLogin();
            },
            onCancel: () => {
              setShow(false);
            },
          });
        } else {
          message.error(response.data.message || '注册失败');
        }
        setLoading(false);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utb3BhY2l0eT0iMC4xIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

      {/* 主卡片 */}
      <div className="relative z-10 flex gap-5">
        <button
          onClick={() => showAction(ActionType.Login)}
          className="w-[150px] h-[40px] rounded-lg text-white text-xl tracking-wider border border-white/50 bg-white/50 hover:bg-white/70 transition-all duration-300 font-medium"
        >
          登录
        </button>
        <button
          onClick={() => showAction(ActionType.Register)}
          className="w-[150px] h-[40px] rounded-lg text-white text-xl tracking-wider border border-white/50 bg-white/50 hover:bg-white/70 transition-all duration-300 font-medium"
        >
          注册
        </button>
      </div>

      {/* 登录/注册弹窗 */}
      {show && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShow(false);
            }
          }}
        >
          <div className="bg-white w-[360px] p-5 rounded-lg shadow-lg">
            <div className="text-center text-xl text-gray-800 tracking-wider mb-5">
              {type === ActionType.Login ? '登录前端监控系统' : '注册账号'}
            </div>

            <Input
              className="mb-5 h-10"
              placeholder="请输入账号"
              value={form.user}
              onChange={(e) => formChange(e.target.value, 'user')}
              prefix={<span className="w-[46px] text-center text-gray-800">帐号：</span>}
              disabled={loading}
            />

            <Input.Password
              className="h-10"
              placeholder="请输入密码"
              value={form.pwd}
              onChange={(e) => formChange(e.target.value, 'pwd')}
              prefix={<span className="w-[46px] text-center text-gray-800">密码：</span>}
              disabled={loading}
              onPressEnter={toSubmit}
            />

            <button
              onClick={toSubmit}
              disabled={loading}
              className="mt-8 w-full bg-gray-800 text-white text-xl py-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : type === ActionType.Login ? '登录' : '注册'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
