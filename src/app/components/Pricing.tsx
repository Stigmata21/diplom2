export default function Pricing() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
                {
                    name: 'Free',
                    price: '0 ₽',
                    features: ['1 компания', 'Учет до 10 сотрудников', 'Базовые отчеты'],
                    desc: 'Идеально для малого бизнеса или тестирования платформы.',
                },
                {
                    name: 'Standart',
                    price: '990 ₽/мес',
                    features: ['3 компании', 'Учет до 50 сотрудников', 'Базовые заметки и задачи'],
                    desc: 'Для растущих команд с простыми задачами.',
                },
                {
                    name: 'Plus',
                    price: '1990 ₽/мес',
                    features: ['5 компаний', 'Учет до 100 сотрудников', 'Аналитика и интеграции'],
                    desc: 'Оптимальный выбор для среднего бизнеса.',
                },
                {
                    name: 'Premium',
                    price: '4990 ₽/мес',
                    features: ['Неограниченно компаний', 'Безлимит сотрудников', 'Полная аналитика и поддержка'],
                    desc: 'Максимальные возможности для крупных предприятий.',
                },
            ].map((plan) => (
                <div
                    key={plan.name}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 flex flex-col"
                >
                    <h3 className="text-2xl font-bold mb-2 text-indigo-600">{plan.name}</h3>
                    <p className="text-3xl font-extrabold mb-3 text-gray-800">{plan.price}</p>
                    <p className="text-gray-600 mb-4">{plan.desc}</p>
                    <ul className="text-gray-700 flex-grow">
                        {plan.features.map((feature) => (
                            <li key={feature} className="mb-2 flex items-center">
                                <span className="text-indigo-500 mr-2">✔</span> {feature}
                            </li>
                        ))}
                    </ul>
                    <button className="mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-all">
                        Выбрать тариф
                    </button>
                </div>
            ))}
        </div>
    );
}