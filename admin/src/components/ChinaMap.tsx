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

export default function ChinaMap({ data, height = 500 }: ChinaMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const chart = echarts.init(chartRef.current);

    // 需要先注册中国地图（简化方案：使用在线地图数据）
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then(response => response.json())
      .then(geoJson => {
        echarts.registerMap('china', geoJson);

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
              if (params.value) {
                return `${params.name}<br/>访问量: ${params.value}`;
              }
              return `${params.name}<br/>暂无数据`;
            },
          },
          visualMap: {
            min: 0,
            max: Math.max(...data.map(d => d.value), 100),
            left: 'left',
            bottom: '20',
            text: ['高', '低'],
            inRange: {
              color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
            },
            calculable: true,
          },
          series: [
            {
              name: '访问量',
              type: 'map',
              map: 'china',
              roam: true,
              emphasis: {
                label: {
                  show: true,
                },
              },
              data: data,
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
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />;
}
