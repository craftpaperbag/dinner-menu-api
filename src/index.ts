export interface Env {
	ANTHROPIC_API_KEY: string;
	AUTH_TOKEN: string;
}

const JAPANESE_INSPIRATIONS = [
	'和の出汁文化（煮付け・あんかけ・だしびたし）',
	'和食の焼き物（西京焼き・幽庵焼き・塩焼き）',
	'和食の蒸し料理（茶碗蒸し・酒蒸し・かぶら蒸し）',
	'和食の煮物（筑前煮・肉じゃが・ひじき煮）',
	'和食の揚げ物（天ぷら・唐揚げ・竜田揚げ）',
	'和食の炒め物（きんぴら・炒り鶏・野菜炒め）',
	'和の鍋料理（寄せ鍋・みぞれ鍋・常夜鍋）',
];

const OTHER_INSPIRATIONS = [
	'地中海料理（オリーブオイル・トマト・ハーブ）',
	'韓国家庭料理（ナムル・チョリム・チゲ）',
	'フランス家庭料理（ブレゼ・ポワレ・グラタン）',
	'タイ・ベトナム料理（ガパオ・フォー・ナンプラー）',
	'中華家庭料理（炒め・蒸し・煮込み）',
	'イタリア郷土料理（アクアパッツァ・カルパッチョ・リゾット）',
	'スペイン料理（アヒージョ・エスカベッシュ・パエリア）',
];

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.headers.get('Authorization') !== `Bearer ${env.AUTH_TOKEN}`) {
			return new Response('Unauthorized', { status: 401 });
		}

		if (request.method !== 'POST') {
			return new Response('POST only', { status: 405 });
		}

		const { memoBody } = (await request.json()) as { memoBody: string };

		const pool = Math.random() < 0.7 ? JAPANESE_INSPIRATIONS : OTHER_INSPIRATIONS;
		const inspirationHint = pool[Math.floor(Math.random() * pool.length)];

		const prompt = `以下は我が家の家族構成(family)、メニューの制約事項(constraints)、そして過去の夕飯記録(menu)です。

${memoBody}

今週の夕飯5案を提案してください。以下のスロット割り当てを必ず守ること:

1案目: 青魚メイン（いわし・鯵・さば・さわら・かますなど）
2案目: 白身魚または海鮮メイン（鯛・鮭・メカジキ・ホタテ・エビなど）
3案目: 肉メイン（豚・鶏・牛のどれか）
4案目: 卵または豆腐メイン（麻婆豆腐・卵とじ・天津飯・グラタンなど）
5案目: 麺または丼（パスタ・ラーメン・親子丼・ガパオライスなど）

追加制約:
- 5案それぞれの調理法が被らないこと（蒸す・焼く・煮る・炒める を分散）
- 過去2週間に登場した主菜とは被らせないこと
- 「鯖の味噌煮」は絶対に出さないこと
- 各カテゴリで最も定番・ありきたりな料理は避け、少しひねりのある料理を選ぶこと
- 今日のインスピレーション: ${inspirationHint}

- 出力は番号付きリスト形式
- 説明文は不要`;

		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-api-key': env.ANTHROPIC_API_KEY,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: 'claude-sonnet-4-6',
				max_tokens: 1024,
				temperature: 1,
				messages: [{ role: 'user', content: prompt }],
			}),
		});

		const data = (await res.json()) as { content: { text: string }[] };
		const menus = `インスピレーション: ${inspirationHint}\n\n${data.content[0].text}`;

		return new Response(JSON.stringify({ menus }), {
			headers: { 'content-type': 'application/json' },
		});
	},
};
