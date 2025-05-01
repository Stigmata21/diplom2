// app/components/Pricing.tsx
interface PlanFeatures {
    companies: number | string;
    employees: number | string;
    reports?: string;
    notes?: string;
    analytics?: string;
}

interface Plan {
    id: number;
    name: string;
    price: number;
    description: string;
    max_companies: number;
    max_users: number;
    features: PlanFeatures;
}

interface PricingProps {
    plans: Plan[];
}

export default function Pricing({ plans }: PricingProps) {
    // Маппинг ключей на русский
    const featureMap: Record<string, string> = {
        companies: 'Компаний',
        employees: 'Сотрудников',
        reports: 'Отчёты',
        notes: 'Заметки',
        analytics: 'Аналитика',
    };
    return (
        <div className="flex flex-wrap justify-center gap-8">
            {plans.map((plan) => (
                <div
                    key={plan.id}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 flex flex-col w-full max-w-xs items-center"
                >
                    <h3 className="text-2xl font-bold mb-2 text-indigo-600">{plan.name}</h3>
                    <p className="text-3xl font-extrabold mb-3 text-gray-800">{plan.price} ₽/мес</p>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <ul className="text-gray-700 flex-grow w-full">
                        {Object.entries(plan.features).map(([key, value]) => (
                            <li key={key} className="mb-2 flex items-center">
                                <span className="text-indigo-500 mr-2">✔</span> {featureMap[key] || key}: {value}
                            </li>
                        ))}
                    </ul>
                    <button className="mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-all w-full">
                        Выбрать тариф
                    </button>
                </div>
            ))}
        </div>
    );
}