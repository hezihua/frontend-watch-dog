'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface MapData {
  name: string;
  value: number;
}

interface ChinaMapProps {
  data: MapData[];
  height?: number;
}

// 省份名称映射（添加"省/市/自治区"后缀）
const provinceNameMap: Record<string, string> = {
  '北京': '北京',
  '天津': '天津',
  '上海': '上海',
  '重庆': '重庆',
  '河北': '河北',
  '山西': '山西',
  '辽宁': '辽宁',
  '吉林': '吉林',
  '黑龙江': '黑龙江',
  '江苏': '江苏',
  '浙江': '浙江',
  '安徽': '安徽',
  '福建': '福建',
  '江西': '江西',
  '山东': '山东',
  '河南': '河南',
  '湖北': '湖北',
  '湖南': '湖南',
  '广东': '广东',
  '海南': '海南',
  '四川': '四川',
  '贵州': '贵州',
  '云南': '云南',
  '陕西': '陕西',
  '甘肃': '甘肃',
  '青海': '青海',
  '台湾': '台湾',
  '内蒙古': '内蒙古',
  '广西': '广西',
  '西藏': '西藏',
  '宁夏': '宁夏',
  '新疆': '新疆',
  '香港': '香港',
  '澳门': '澳门',
};

export default function ChinaMap({ data, height = 500 }: ChinaMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // 转换省份名称
  const normalizedData = data.map(item => ({
    name: provinceNameMap[item.name] || item.name,
    value: item.value,
  }));

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const chart = echarts.init(chartRef.current);

    // 需要先注册中国地图（简化方案：使用在线地图数据）
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then(response => response.json())
      .then(geoJson => {
        echarts.registerMap('china', geoJson);

        const maxValue = Math.max(...normalizedData.map(d => d.value), 1);

        const option = {
          title: {
            text: '用户地域分布',
            left: 'center',
            top: 20,
            textStyle: {
              color: '#333',
              fontSize: 18,
            },
          },
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
              if (params.value !== undefined && params.value > 0) {
                return `${params.name}<br/>访问量: <strong>${params.value}</strong> 次`;
              }
              return `${params.name}<br/>暂无访问数据`;
            },
          },
          visualMap: {
            min: 0,
            max: maxValue,
            left: 'left',
            bottom: '20',
            text: ['访问量高', '访问量低'],
            inRange: {
              color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
            },
            textStyle: {
              color: '#333',
            },
            calculable: true,
            show: true,
          },
          series: [
            {
              name: '访问量',
              type: 'map',
              map: 'china',
              roam: true,
              itemStyle: {
                areaColor: '#f3f3f3',
                borderColor: '#999',
              },
              emphasis: {
                label: {
                  show: true,
                  color: '#fff',
                },
                itemStyle: {
                  areaColor: '#ffd700',
                },
              },
              data: normalizedData,
            },
          ],
        };

        chart.setOption(option);
      })
      .catch(error => {
        console.error('加载地图数据失败:', error);
      });

    // 响应式调整
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [normalizedData]);

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />;
}
