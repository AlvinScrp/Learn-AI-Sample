/**
 * 香港地区GeoJSON数据加载器
 * 加载本地的810000_full.json文件并注册到ECharts
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports', 'echarts'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        factory(exports, require('echarts'));
    } else {
        factory({}, root.echarts);
    }
}(this, function (exports, echarts) {
    var log = function (msg) {
        if (typeof console !== 'undefined') {
            console && console.error && console.error(msg);
        }
    }
    
    if (!echarts) {
        log('ECharts is not loaded');
        return;
    }
    
    if (!echarts.registerMap) {
        log('ECharts Map is not loaded');
        return;
    }
    
    /**
     * 加载本地GeoJSON文件并注册地图
     */
    function loadLocalGeoJSON() {
        // 加载本地的810000_full.json文件
        fetch('./810000_full.json')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.status);
                }
                return response.json();
            })
            .then(function(geoJson) {
                // 注册香港地图到ECharts
                echarts.registerMap('HK', geoJson);
                console.log('✅ 香港地图数据加载成功');
                
                // 设置成功加载标志
                if (typeof window !== 'undefined') {
                    window.mapLoaded = true;
                }
                
                // 触发地图就绪事件
                if (typeof window !== 'undefined') {
                    var event = new CustomEvent('hk-map-ready', {
                        detail: { 
                            success: true, 
                            message: '香港地图数据已成功加载并注册到ECharts' 
                        }
                    });
                    window.dispatchEvent(event);
                    console.log('✅ hk-map-ready 事件已触发');
                }
            })
            .catch(function(error) {
                console.error('❌ 加载香港地图数据失败:', error);
                log('香港GeoJSON地图数据加载失败: ' + error.message);
                
                // 触发错误事件
                if (typeof window !== 'undefined') {
                    var errorEvent = new CustomEvent('hk-map-error', {
                        detail: { 
                            success: false, 
                            error: error.message 
                        }
                    });
                    window.dispatchEvent(errorEvent);
                }
            });
    }
    
    // 等待DOM加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadLocalGeoJSON);
    } else {
        // DOM已经加载完成，直接执行
        loadLocalGeoJSON();
    }
    
    // 导出加载函数供外部调用
    exports.loadHongKongMap = loadLocalGeoJSON;
})); 