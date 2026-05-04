/**
 * 美食菜谱管理系统
 * 优化版本 - 提供更完善的菜谱展示和搜索功能
 */

class FoodManager {
    constructor() {
        this.foods = this.getFoodsData();
        this.$content = document.querySelector('.content');
        this.init();
    }

    /**
     * 获取菜谱数据
     */
    getFoodsData() {
        return [
            {
                id: 1,
                name: '炒面条',
                category: '主食',
                difficulty: '中等',
                time: '30分钟',
                ingredients: ['1.2元的圆面', '菜椒', '蒜苔', '鸡蛋', '肉丝', '洋葱', '西红柿丁'],
                steps: `
                    <p>面的处理：1.2元的圆面煮变软，然后过凉水，之后放入少许的盐，鸡精，生抽，老抽，十三香少许，搅拌</p>
                    <p>如果炒鸡蛋的话：一个不辣的菜椒，蒜苔切段，3个鸡蛋。放油下鸡蛋，捞出，再少许油放菜椒，放蒜苔，炒一会之后放生抽，放鸡精，放少许盐，少许醋，期间放少许水，炒个3-5分钟之后把面放进去快速搅拌1分钟就好了。</p>
                    <p>如果要炒肉的话：6块钱的肉放生抽，老抽，料酒，少许胡椒粉，少许盐，少许玉米淀粉，搅拌均匀腌制。</p>
                    <p><span class="f-red">另外一种料</span>：包菜切丝，胡萝卜切丝，绿豆芽，炒饭的同时要煮面，煮好面之后过凉水，然后加入老抽，油搅拌，炒菜：放油，炒鸡蛋，之后放葱花，炒一下之后放胡萝卜丝，包菜丝，先炒一会再放绿豆芽，放生抽，鸡精，盐调味，这个时候可以适当放一些清水炒，炒熟之后放面条，搅拌炒一会</p>
                    <p><span class="f-red">豆豉炒肉</span>：肥肉炒出油脂，放瘦肉片，炒熟后放入葱姜蒜豆豉，炒一会之后放入黄酒，放一点老抽上色，然后放入青红辣椒，调味：2勺生抽，1勺蚝油，1勺陈醋，少许白糖，少许盐，放入少半碗面汤，大火炒下，最后放入葱段</p>
                    <p><span class="f-red">牛肉炒</span>：牛肉腌制之后炒熟捞出，放油，葱姜蒜，放西红柿丁，盐，炒出沙，放绿豆芽，青椒，洋葱，断生之后，调料：2勺生抽，1勺蚝油，1勺老抽，1勺番茄酱，少许五香粉，半勺淀粉，少许温水，开大火浓稠之后放面，放牛肉</p>
                `,
                color: 'inherit'
            }, {
                id: 2,
                name: '炒刀削',
                category: '主食',
                difficulty: '简单',
                time: '25分钟',
                ingredients: ['1.2元刀削面', '2元绿豆芽', '彩椒丝', '西红柿', '火腿肠'],
                steps: `
                    <p>做法：炒菜的时候要同步煮面，稍微生一点然后过冷水；锅热油，炒鸡蛋捞出，油继续用放大蒜，葱段，出味道后放西红柿丁，一直炒到有沙之后放鸡蛋，放绿豆芽，彩椒丝，火腿肠然后放生抽，老抽，耗油，盐，一点鸡精，炒一会之后放面条进去搅拌一分钟左右就ok了</p>
                `,
                color: 'red'
            }, {
                id: 3,
                name: '新疆炒拉条',
                category: '主食',
                difficulty: '中等',
                time: '35分钟',
                ingredients: ['1.2元的拉条', '西红柿', '羊肉', '菜椒', '洋葱', '芹菜'],
                steps: `
                    <p>准备工作：拉条煮软过凉水，牛肉用生抽，白胡椒粉，玉米淀粉，食用油腌制</p>
                    <p>做法：牛肉翻炒一下之后放芹菜，菜椒，洋葱，蒜末炒香，之后放番茄块，加生抽，番茄酱，加多多的孜然粉，把拉条放进去翻炒，这个时候可以看下咸淡，炒一会即可</p>
                `,
                color: 'inherit'
            }, {
                id: 4,
                name: '炝锅面',
                category: '主食',
                difficulty: '简单',
                time: '20分钟',
                ingredients: ['1.2元的圆面', '菜椒', '豆芽', '海带'],
                steps: `
                    <p>提前准备：肉放生抽，老抽，料酒，白胡椒粉，少许淀粉</p>
                    <p>做法：热油，放肉，放五香粉，炒差不多之后放菜椒，豆芽，海带，放入开水，水开之后放入面条，差不多只有放鸡精，香油</p>
                `,
                color: 'inherit'
            },
            {
                id: 5,
                name: '阳春面',
                category: '主食',
                difficulty: '简单',
                time: '15分钟',
                ingredients: ['龙须面'],
                steps: `
                    <p>汤底：葱花，猪油（芝麻油），生抽，少许糖，鸡精，醋,白胡椒，然后热油倒进去激发香味，加几勺开水或者面汤</p>
                    <p>做法：开水加少量盐煮面，直接放入汤底中，可以加一个鸡蛋</p>
                    <p>加肉：肉丝加少许油，胡椒粉，淀粉，腌制，杏蘑菇切丝，热锅，凉油，下肉丝，炒到变色，盛出，之后加油，放蒜泥，放杏蘑菇到变软出水，把肉丝放进去，放一勺生抽，半勺老抽，一勺蚝油，快速翻炒之后放菜椒丝，放鸡精，盛出</p>
                    <p><span class="f-red">另外一个汤底：</span>去皮西红柿小丁，小葱花，虾皮，紫菜，香油，少许生抽，盐，味精，鸡精</p>
                `,
                color: 'red'
            },{
                id: 6,
                name:'口菇面条',
                category: '主食',
                difficulty: '中等',
                time: '25分钟',
                ingredients: ['1.2元的圆面', '口菇', '青菜', '肉沫'],
                steps: `
                    <p>做法：肉沫加料酒，生抽，耗油，直接热锅炒下盛出来，热锅放油，口菇直接煎出水，然后，剪成小块，之后放水，放面，煮一半之后，放生抽，食盐，鸡精，耗油，肉沫，生菜，最后出锅撒上葱花</p>
                `,
                color: 'inherit'
            },
            {
                id: 7,
                name: '酸辣粉',
                category: '小吃',
                difficulty: '简单',
                time: '20分钟',
                ingredients: ['豆泡', '2元海带', '1张豆腐皮', '两包土豆粉', '花生脆', '鹌鹑蛋', '香菜', '葱花'],
                steps: `
                    <p>调料：蒜泥，芝麻，小葱花，辣椒面，放热油婆一下，之后放一勺生抽，半勺老抽，半勺糖，2勺醋，少许五香粉，少许十三香，少许盐，再放半碗白开水，</p>
                    <p>做法：全部食材水开之后放进去煮熟，土豆粉最后放进去煮2分钟就行，捞出，放调料，花生脆，香菜，搅拌</p>
                `,
                color: 'red'
            },
            {
                id: 8,
                name: '黄焖鸡',
                category: '主菜',
                difficulty: '中等',
                time: '60分钟',
                ingredients: ['整只鸡切块', '香菇', '菜椒', '土豆'],
                steps: `
                    <p>提前准备：1、香菇洗干净泡水。2、鸡块洗干净之后放配料：生抽，老抽，料酒，白胡椒粉，生姜片，蚝油，五香粉腌制。3、土豆切好之后洗下淀粉</p>
                    <p>做法：锅中热油，放土豆块，变色之后捞出备用。热油，放入冰糖，炒糖色（小火慢慢化开，大火容易苦），放入鸡块，大火翻炒上色之后，再放入姜片，香叶，蒜瓣，炒一会之后，放料酒，蚝油，生抽，白胡椒粉，老抽，冰糖，翻炒一会，放入香菇，并把香菇泡的水倒进去，一定要过鸡块的水，大火烧开之后去浮沫，转中小火30分钟后，放入土豆块10分钟，转大火收汁，放入鸡精，菜椒，煮3分钟就行</p>
                `,
                color: 'red'
            },
            {
                id: 9,
                name: '红烧肉/排骨',
                category: '主菜',
                difficulty: '中等',
                time: '90分钟',
                ingredients: ['五花肉','排骨'],
                steps: `
                    <p>提前准备：红烧肉切块洗干净之后，撩水（葱段，生姜，料酒），之后洗干净弄干。鸡蛋煮几个：冷水没过鸡蛋，煮9-10分钟，可以放适量的盐或者米醋，之后跟香叶，桂皮，姜泡起来</p>
                    <p>做法：热油，炒一个糖色，放入五花肉/排骨翻炒出香味，放上面的鸡蛋水，放料酒，生抽，老抽，加入没过肉的温水，大火烧开之后转中小火40分钟，中间翻炒几次，之后大火收汁</p>
                `,
                color: 'inherit'
            },
            {
                id: 10,
                name: '牛肉炒饭',
                category: '主食',
                difficulty: '简单',
                time: '20分钟',
                ingredients: ['20元牛肉粒', '胡萝卜', '菜椒', '葱花'],
                steps: `
                    <p>提前准备：牛肉粒放1勺蚝油，1勺料酒，1勺生抽，2快姜片，白胡椒粉，五香粉，少许淀粉</p>
                    <p>做法：热油，放牛肉粒翻炒一会之后放胡萝卜粒，菜椒粒，翻炒1分钟之后，放入米饭，少许生抽，鸡精，炒个3分钟后，放葱花</p>
                `,
                color: 'red'
            },
            {
                id: 11,
                name:'热干面',
                category: '主食',
                difficulty: '简单',
                time: '15分钟',
                ingredients: ['3元热干面','酸豆角','甜辣萝卜','绿豆芽'],
                steps: `
                    <p>调芝麻酱：芝麻酱，用温开水化开，不稠不稀，然后放入甜面酱，鸡精，少量盐，香油，胡椒粉，香醋，搅拌均匀</p>
                    <p>做法：提前煮好绿豆芽，面煮好之后，放入3勺芝麻酱，1勺酸豆角，1勺甜辣萝卜，1勺绿豆芽，搅拌均匀就行</p>
                `,
                color: 'red'
            },
            {
                id: 12,
                name:'宫保鸡丁',
                category: '主菜',
                difficulty: '中等',
                time: '30分钟',
                ingredients:['鸡胸肉','胡萝卜','黄瓜','炸花生','郫县豆瓣酱'],
                steps: `
                    <p>提前准备：1、鸡胸肉切丁，加入花雕酒，白胡椒粉，少量盐，玉米淀粉，抓匀之后再放入食用油；2、黄瓜和胡萝卜切丁，放少许盐，抓匀腌制一会，炒菜前用水冲掉盐分，再弄干水分</p>
                    <p>料汁：生抽2勺，蚝油1勺，米醋1勺，白糖2勺，淀粉1勺，清水半碗，有鸡粉可以加一点提鲜</p>
                    <p>做法：热油，鸡丁翻炒变色，然后盛出，再放油，发葱花，蒜末炒香，放入郫县豆瓣酱，炒出红油，放黄瓜，胡萝卜丁，炒软，放入鸡丁，翻炒均匀，倒入调好的料汁，翻炒至沸腾气泡，最后放入油炸花生，快速翻炒之后出锅</p>
                `,
                color: 'inherit'
            },
            {
                id: 13,
                name:'火腿鸡蛋',
                category: '主菜',
                difficulty: '简单',
                time: '15分钟',
                ingredients: ['火腿', '5个鸡蛋'],
                steps: `
                    <p>料汁：2勺生抽，1勺醋，半勺蚝油，1勺辣椒面，半勺白糖，1勺淀粉，半碗清水。</p>
                    <p>做法：鸡蛋炒熟，切块，盛出，再煎火腿，煎香，放蛋，调味料，收汁，撒上葱花</p>
                `,
                color: 'red'
            },
            {
                id: 14,
                name: '辣椒炒肉<br>《一碗香》',
                category: '主菜',
                difficulty: '中等',
                time: '25分钟',
                ingredients: ['螺丝椒', '豆豉', '肉片', '小米辣'],
                steps: `
                    <p>做法：先炒鸡蛋（可以加少量的米醋）盛出，锅中不放油，直接放螺丝椒，少许盐，煸香之后盛出，锅中放油，放肉片，出油变色之后就可以放豆豉，蒜，小米辣，放螺丝椒，炒一下之后放，生抽，老抽，白胡椒粉，香油，之后放鸡蛋，之后再放一点料酒，大火出锅</p>
                `,
                color: 'red'
            },
            {
                id: 15,
                name: '营养粥',
                category: '汤粥',
                difficulty: '简单',
                time: '60分钟',
                ingredients: ['各种豆'],
                steps: `
                    <p>五红汤：枸杞，红豆，红枣，花生，红糖，（薏米，紫薯）</p>
                    <p><span style="color:Red;">养发粥</span>：糯米，红枣，黑米，黑芝麻，花生，黑豆</p>
                    <p>营养粥：红豆，花生，莲子，红米，黑米，红枣，枸杞</p>
                    <p>素颜快乐水：一个苹果切块，5个去核的红枣，一起煮水。范围：皮肤粗糙，面色萎黄，脸上长细纹，脱发掉发，精神头不好，懒得动的</p>
                    <p>刷脂减肥水：苹果带皮切片，陈皮5g，生姜2片，一起煮水，范围：肚子大，大腿肉，容易困</p>
                `,
                color: 'inherit'
            }, {
                id: 16,
                name: '鲫鱼汤',
                category: '汤粥',
                difficulty: '中等',
                time: '30分钟',
                ingredients: ['鲫鱼', '豆腐', '葱', '香菜'],
                steps: `
                    <p>做法：豆腐一块切小方块，香菜，葱花，姜，胡椒，先把鲫鱼洗干净然后斜切一下，开火放油，全程大火，放鱼，鱼不要经常翻动，可以翻动锅让鱼走动，快煎好时候放姜葱段，煎到两面金黄，放水，刚基本埋住鱼为好，水开后煮5分钟，放豆腐块，再煮5分钟，然后放香菜，胡椒，盐，过一分钟即可，撒上葱</p>
                `,
                color: 'red'
            },{
                id: 17,
                name:'馄饨汤',
                category: '汤粥',
                difficulty: '简单',
                time: '15分钟',
                ingredients:['紫菜','虾皮','香葱','香菜'],
                steps: `
                    <p>做法：老抽一点，生抽一点，盐一点，白胡椒粉，鸡精，干紫菜，虾皮，香菜，香葱，香油，最后放面汤</p>
                `,
                color: 'inherit'
            },{
                id: 18,
                name:'渔老四火锅',
                category: '火锅',
                difficulty: '简单',
                time: '20分钟',
                ingredients:['冬瓜200g','芹菜叶','玉米一根','枸杞10个','红枣3-5颗','姜3-4片','大葱段2段','干香菇2-3个'],
                steps: `
                    <p>清汤或者骨汤，加少许盐，白胡椒粉，料酒，鸡精或者味精（可不放）</p>
                `,
                color: 'inherit'
            }
        ];
    }

    /**
     * 初始化应用
     */
    init() {
        this.createHeader();
        this.createSearchBar();
        this.createTable();
        this.addEventListeners();
    }

    /**
     * 创建页面头部
     */
    createHeader() {
        const header = document.createElement('div');
        header.className = 'food-header';
        header.innerHTML = `
            <h1>🍳 美食菜谱管理系统</h1>
            <p>共 ${this.foods.length} 道菜谱 | 涵盖主食、主菜、汤粥、小吃等多种类型</p>
        `;
        this.$content.appendChild(header);
    }

    /**
     * 创建搜索栏
     */
    createSearchBar() {
        const searchBar = document.createElement('div');
        searchBar.className = 'search-bar';
        searchBar.innerHTML = `
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="搜索菜名、食材或分类..." class="search-input">
                <button id="searchBtn" class="search-btn">🔍 搜索</button>
                <button id="resetBtn" class="reset-btn">🔄 重置</button>
            </div>
            <div class="filter-container">
                <select id="categoryFilter" class="filter-select">
                    <option value="">所有分类</option>
                    <option value="主食">主食</option>
                    <option value="主菜">主菜</option>
                    <option value="汤粥">汤粥</option>
                    <option value="小吃">小吃</option>
                    <option value="火锅">火锅</option>
                </select>
                <select id="difficultyFilter" class="filter-select">
                    <option value="">所有难度</option>
                    <option value="简单">简单</option>
                    <option value="中等">中等</option>
                </select>
            </div>
        `;
        this.$content.appendChild(searchBar);
    }

    /**
     * 创建表格
     */
    createTable() {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.innerHTML = `
            <table class="food-table" id="foodTable">
                <thead>
                    <tr>
                        <th width="60">序号</th>
                        <th width="120">菜名</th>
                        <th width="80">分类</th>
                        <th width="80">难度</th>
                        <th width="80">时间</th>
                        <th>食材</th>
                        <th>做法</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
        this.$content.appendChild(tableContainer);
        this.renderTable(this.foods);
    }

    /**
     * 渲染表格数据
     */
    renderTable(foods) {
        const tbody = document.querySelector('#foodTable tbody');
        tbody.innerHTML = '';

        foods.forEach(food => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center">${food.id}</td>
                <td style="color:${food.color}; font-weight:bold;">${food.name}</td>
                <td class="text-center">${food.category}</td>
                <td class="text-center">
                    <span class="difficulty-badge difficulty-${food.difficulty === '简单' ? 'easy' : 'medium'}">
                        ${food.difficulty}
                    </span>
                </td>
                <td class="text-center">${food.time}</td>
                <td style="white-space: normal;">${food.ingredients.join('，')}</td>
                <td style="white-space: normal;">${food.steps}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * 搜索功能
     */
    searchFoods() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const difficultyFilter = document.getElementById('difficultyFilter').value;

        const filteredFoods = this.foods.filter(food => {
            const matchesSearch = !searchTerm || 
                food.name.toLowerCase().includes(searchTerm) ||
                food.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm)) ||
                food.category.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || food.category === categoryFilter;
            const matchesDifficulty = !difficultyFilter || food.difficulty === difficultyFilter;

            return matchesSearch && matchesCategory && matchesDifficulty;
        });

        this.renderTable(filteredFoods);
    }

    /**
     * 添加事件监听器
     */
    addEventListeners() {
        document.getElementById('searchBtn').addEventListener('click', () => this.searchFoods());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.searchFoods());
        document.getElementById('categoryFilter').addEventListener('change', () => this.searchFoods());
        document.getElementById('difficultyFilter').addEventListener('change', () => this.searchFoods());
    }

    /**
     * 重置过滤器
     */
    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('difficultyFilter').value = '';
        this.renderTable(this.foods);
    }
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .food-header {
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    
    .food-header h1 {
        margin: 0;
        font-size: 2.5rem;
    }
    
    .search-bar {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    
    .search-container {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .search-input {
        flex: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
    }
    
    .search-btn, .reset-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .search-btn {
        background: #007bff;
        color: white;
    }
    
    .reset-btn {
        background: #6c757d;
        color: white;
    }
    
    .filter-container {
        display: flex;
        gap: 10px;
    }
    
    .filter-select {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
    
    .table-container {
        overflow-x: auto;
    }
    
    .food-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    
    .food-table th {
        background: #343a40;
        color: white;
        padding: 15px;
        text-align: left;
        font-weight: 600;
    }
    
    .food-table td {
        padding: 12px 15px;
        border-bottom: 1px solid #eee;
    }
    
    .food-table tr:hover {
        background: #f8f9fa;
    }
    
    .text-center {
        text-align: center;
    }
    
    .difficulty-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
    }
    
    .difficulty-easy {
        background: #d4edda;
        color: #155724;
    }
    
    .difficulty-medium {
        background: #fff3cd;
        color: #856404;
    }
    
    .f-red {
        color: #dc3545;
        font-weight: bold;
    }
    
    @media (max-width: 768px) {
        .search-container {
            flex-direction: column;
        }
        
        .food-table {
            font-size: 14px;
        }
        
        .food-table th, .food-table td {
            padding: 8px;
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new FoodManager();
});
