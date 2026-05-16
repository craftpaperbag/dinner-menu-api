export interface Env {
	ANTHROPIC_API_KEY: string;
}

const INSPIRATIONS = [
	'地中海料理（オリーブオイル・トマト・ハーブ）',
	'韓国家庭料理（ナムル・チョリム・チゲ）',
	'フランス家庭料理（ブレゼ・ポワレ・グラタン）',
	'タイ・ベトナム料理（ガパオ・フォー・ナンプラー）',
	'北欧スカンジナビア料理（燻製・マリネ・根菜）',
	'中華家庭料理（炒め・蒸し・煮込み）',
	'和の出汁文化（煮付け・あんかけ・だしびたし）',
	'イタリア郷土料理（アクアパッツァ・カルパッチョ・リゾット）',
	'スペイン料理（アヒージョ・エスカベッシュ・パエリア）',
	'中東料理（シャクシュカ・クスクス・ザアタル）',
];

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('POST only', { status: 405 });
		}

		const { memoBody } = (await request.json()) as { memoBody: string };

		const inspirationHint = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];

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
		const menus = data.content[0].text;

		return new Response(JSON.stringify({ inspiration: inspirationHint, menus }), {
			headers: { 'content-type': 'application/json' },
		});
	},
};
