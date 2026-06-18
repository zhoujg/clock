<?php
/**
 * AI 内容生成 API
 * 支持：AI 语录生成、天气解读
 * 
 * 使用方式：
 *   GET /api/ai-content.php?action=quote
 *   GET /api/ai-content.php?action=weather-insight&weather=晴&temp=25&city=深圳
 *   GET /api/ai-content.php?action=daily-story&date=2026-06-18
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth.php';

// CORS 头
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ALLOWED_ORIGINS === '*' ? '*' : explode(',', ALLOWED_ORIGINS);
if (ALLOWED_ORIGINS === '*' || in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . (ALLOWED_ORIGINS === '*' ? $origin ?: '*' : $origin));
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 获取 action
$action = $_GET['action'] ?? '';
$actions = ['quote', 'weather-insight', 'daily-story'];

if (!in_array($action, $actions)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => '无效的 action，支持: ' . implode(', ', $actions)]);
    exit;
}

// 读取配置文件中的 AI API 设置
$aiApiUrl = defined('AI_API_URL') ? AI_API_URL : 'https://api.openai.com/v1/chat/completions';
$aiApiKey = defined('AI_API_KEY') ? AI_API_KEY : '';
$aiModel   = defined('AI_MODEL') ? AI_MODEL : 'gpt-4o-mini';

// 如果未配置 API Key，返回模拟数据（开发模式）
if (empty($aiApiKey)) {
    sendFallbackResponse($action, $_GET);
    exit;
}

// 根据 action 构建提示词
switch ($action) {
    case 'quote':
        $prompt = buildQuotePrompt();
        break;
    case 'weather-insight':
        $weather = $_GET['weather'] ?? '';
        $temp    = $_GET['temp'] ?? '';
        $city    = $_GET['city'] ?? '';
        $prompt  = buildWeatherInsightPrompt($weather, $temp, $city);
        break;
    case 'daily-story':
        $date   = $_GET['date'] ?? date('Y-m-d');
        $prompt = buildDailyStoryPrompt($date);
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => '未知 action']);
        exit;
}

// 调用 AI API
$aiResponse = callAiApi($aiApiUrl, $aiApiKey, $aiModel, $prompt);

if (!$aiResponse) {
    // API 调用失败，返回模拟数据
    sendFallbackResponse($action, $_GET);
    exit;
}

// 返回结果
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true,
    'action'  => $action,
    'content' => $aiResponse,
    'cached'  => false,
], JSON_UNESCAPED_UNICODE);

// ===================== 函数定义 =====================

/**
 * 构建 AI 语录提示词
 */
function buildQuotePrompt() {
    $hour = (int)date('H');
    $season = getSeason();
    $weekday = ['日','一','二','三','四','五','六'][(int)date('w')];
    
    // 根据时间段调整语录风格
    if ($hour >= 5 && $hour < 12) {
        $timeContext = '早晨，充满希望和活力';
    } elseif ($hour >= 12 && $hour < 14) {
        $timeContext = '中午，适合稍作休息';
    } elseif ($hour >= 14 && $hour < 18) {
        $timeContext = '下午，继续努力奋进';
    } elseif ($hour >= 18 && $hour < 22) {
        $timeContext = '傍晚，适合总结和反思';
    } else {
        $timeContext = '夜晚，安静思考的时间';
    }
    
    return "你是一个富有智慧的人生导师。请生成一句中英文双语励志语录。\n" .
           "要求：\n" .
           "1. 语录文本例如：Home is where the heart is. | 心之所安，即是吾家。" .
           "2. 每次生成的内容要有变化，不要重复\n" .
           "只输出语录内容，不要有任何其他说明。";
}

/**
 * 构建天气解读提示词
 */
function buildWeatherInsightPrompt($weather, $temp, $city) {
    $weatherDesc = $weather ?: '未知';
    $tempDesc    = $temp !== '' ? $temp . '°C' : '未知温度';
    $cityDesc    = $city ?: '你所在的城市';
    $hour        = (int)date('H');
    
    $timeOfDay = $hour < 6 ? '凌晨' : ($hour < 12 ? '上午' : ($hour < 18 ? '下午' : '晚上'));
    
    return "你是一个贴心的天气助手。请根据以下天气信息，生成一段温暖自然的天气解读（不超过50字）。\n" .
           "地点：{$cityDesc}\n" .
           "天气：{$weatherDesc}\n" .
           "温度：{$tempDesc}\n" .
           "时间段：{$timeOfDay}\n" .
           "要求：\n" .
           "1. 语气亲切自然，像朋友在说话\n" .
           "2. 结合天气给出实用建议（穿衣、出行、活动 等.）\n" .
           "3. 不要生硬堆砌信息，要流畅自然\n" .
           "4. 直接输出解读内容，不要加\"天气解读：\"等前缀\n" .
           "只输出解读内容，不要有其他说明。";
}

/**
 * 构建每日故事提示词
 */
function buildDailyStoryPrompt($date) {
    $timestamp = strtotime($date);
    $month = (int)date('n', $timestamp);
    $day   = (int)date('j', $timestamp);
    $weekday = ['日','一','二','三','四','五','六'][(int)date('w', $timestamp)];
    
    return "你是一个温暖的故事讲述者。请根据今天的日期，写一段短小的每日故事或感悟（100-150字）。\n" .
           "日期：{$date}（星期{$weekday}）\n" .
           "要求：\n" .
           "1. 内容温暖、有深度，能引发思考\n" .
           "2. 可以结合节气、历史事件、人生感悟\n" .
           "3. 适合在时钟应用中展示，给人一天的美好开始\n" .
           "4. 语言优美但不华丽，真诚而不矫情\n" .
           "5. 直接输出故事内容，不要标题\n" .
           "只输出故事内容，不要有其他说明。";
}

/**
 * 调用 AI API
 */
function callAiApi($apiUrl, $apiKey, $model, $prompt) {
    $messages = [
        ['role' => 'user', 'content' => $prompt]
    ];
    
    $data = [
        'model'       => $model,
        'messages'    => $messages,
        'max_tokens'  => 300,
        'temperature' => 0.8,
    ];
    
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);
    
    if ($error || $httpCode !== 200) {
        error_log("AI API 调用失败: HTTP {$httpCode}, {$error}");
        return false;
    }
    
    $result = json_decode($response, true);
    if (!isset($result['choices'][0]['message']['content'])) {
        error_log("AI API 返回格式异常: " . $response);
        return false;
    }
    
    return trim($result['choices'][0]['message']['content']);
}

/**
 * 返回模拟数据（当 API 不可用时）
 */
function sendFallbackResponse($action, $params) {
    $fallbacks = [
        'quote' => [
            '每一天都是新的开始，用微笑迎接阳光。',
            '时间不等人，但你可以超越时间。',
            '专注当下，未来自会精彩。',
            '小小的坚持，成就大大的梦想。',
            '今天的你，比昨天更接近目标。',
        ],
        'weather-insight' => buildFallbackWeatherInsight(
            $params['weather'] ?? '',
            $params['temp'] ?? '',
            $params['city'] ?? ''
        ),
        'daily-story' => '每一个平凡的日子，都藏着不平凡的瞬间。用心感受生活，你会发现，美好一直都在身边。无论昨天如何，今天都是崭新的开始。愿你在时间的流淌中，找到属于自己的节奏。',
    ];
    
    $content = '';
    if ($action === 'quote') {
        $content = $fallbacks['quote'][array_rand($fallbacks['quote'])];
    } elseif ($action === 'weather-insight') {
        $content = $fallbacks['weather-insight'];
    } else {
        $content = $fallbacks['daily-story'];
    }
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success'     => true,
        'action'      => $action,
        'content'     => $content,
        'cached'      => true,
        'fallback'    => true,
        'notice'      => '当前使用模拟数据，请配置 AI_API_KEY 以启用 AI 生成',
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * 构建 fallback 天气解读
 */
function buildFallbackWeatherInsight($weather, $temp, $city) {
    $cityName = $city ?: '你所在的城市';
    $tempVal  = $temp !== '' ? (int)$temp : null;
    
    $insights = [];
    
    // 根据天气
    if (strpos($weather, '雨') !== false) {
        $insights[] = '今天下雨，出门记得带伞，适合在室内专注工作。';
    } elseif (strpos($weather, '晴') !== false) {
        $insights[] = '阳光明媚，是个出门走走的好日子！';
    } elseif (strpos($weather, '云') !== false) {
        $insights[] = '多云天气，气温适宜，心情也会很舒适。';
    } elseif (strpos($weather, '雪') !== false) {
        $insights[] = '下雪了！注意保暖，欣赏这美丽的雪景吧。';
    }
    
    // 根据温度
    if ($tempVal !== null) {
        if ($tempVal >= 30) {
            $insights[] = '天气炎热，多喝水，注意防暑。';
        } elseif ($tempVal <= 5) {
            $insights[] = '天气寒冷，记得多穿点，别感冒了。';
        } elseif ($tempVal >= 20 && $tempVal <= 25) {
            $insights[] = '温度刚刚好，是一年中最舒适的时候。';
        }
    }
    
    if (empty($insights)) {
        return "{$cityName}今天天气{$weather}" . ($tempVal !== null ? "，温度{$tempVal}°C" : '') . "，祝你有个美好的一天！";
    }
    
    return implode('', $insights);
}

/**
 * 获取当前季节
 */
function getSeason() {
    $month = (int)date('n');
    if ($month >= 3 && $month <= 5) return '春天';
    if ($month >= 6 && $month <= 8) return '夏天';
    if ($month >= 9 && $month <= 11) return '秋天';
    return '冬天';
}
