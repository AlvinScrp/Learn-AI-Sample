import HotelRecommendationSystem from './hotel_recommendation.js';

async function testRecommendation() {
    const system = new HotelRecommendationSystem();
    
    console.log('正在加载数据...');
    await system.loadData();
    
    // 测试推荐功能
    const testHotels = ['Hilton', 'Sheraton', 'Westin'];
    
    for (const hotelName of testHotels) {
        console.log(`\n测试酒店: ${hotelName}`);
        await system.searchAndRecommend(hotelName);
    }
}

testRecommendation().catch(console.error);