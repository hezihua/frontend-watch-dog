import React, { useState } from 'react';
import { Modal, Form, Radio, Input, message } from 'antd';
import { createApp } from '@/src/api';
import { AppTypes, AppType } from '@/src/constants';
import { useAppStore } from '@/src/hooks';

interface AddApplicationIn{
  open: boolean;
  onClose: () => void;
}
export const AddApplication: React.FC<AddApplicationIn> = ({ open, onClose }) => {
  const [form] = Form.useForm();

  const { appDispatch } = useAppStore();

  const [loading, setLoading] = useState(false);

  return (
    <Modal
      open={open}
      destroyOnClose
      onOk={async() => {
        await form.validateFields();
        setLoading(true);
        const result = await createApp(form.getFieldsValue());
        await appDispatch.getAppList();
        setLoading(false);
        if (result?.data?.appId) {
          Modal.success({
            title: '应用创建成功！',
            content: (
              <div>
                <p>应用名称：{result.data.appName}</p>
                <p>应用ID：<strong style={{ color: '#1890ff', userSelect: 'all' }}>{result.data.appId}</strong></p>
                <p style={{ marginTop: 16, color: '#666' }}>请复制上面的 appId，在集成 SDK 时使用</p>
              </div>
            ),
            width: 500,
          });
        } else {
          message.success('应用成功创建！');
        }
        onClose();
      }}
      onCancel={onClose}
      okButtonProps={{
        loading,
      }}
      title="创建应用">

      <Form
        form={form}
      >
        <Form.Item
          name="appName"
          label="应用名称"
          rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="appType"
          label="应用类型"
          initialValue={AppType.WEB}
          rules={[{ required: true }]}>
          <Radio.Group>
            {AppTypes.map(((item) =>
              <Radio
                value={item.value}
                disabled={item.value !== AppType.WEB}
                key={item.value}>
                {item.label}
              </Radio>))}
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};
