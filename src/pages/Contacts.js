import React from 'react';
import '../styles/about.css';

export default function Contacts() {
    return (
        <div className="about-container">
            <div className="about-content">
                <h1>Контакты</h1>
                
                <h2>Наши офисы</h2>

                <h3>GlobalGid</h3>
                <p>
                    <strong>Основной офис:</strong> Минск
                </p>
                <p>
                    <strong>Режим работы:</strong> Пн-Пт с 10:00 до 19:00
                </p>

                <h3>Региональные представительства</h3>
                <p>
                    В крупнейших городах Беларуси и соседних стран
                </p>

                <h2>Телефоны поддержки</h2>

                <h3>Общие вопросы:</h3>
                <p>
                    +375 (XX) XXX-XX-XX
                </p>
                <p>
                    Пн-Вс с 9:00 до 21:00
                </p>

                <h3>Поддержка гидов:</h3>
                <p>
                    +375 (XX) XXX-XX-XX
                </p>
                <p>
                    Пн-Пт с 10:00 до 18:00
                </p>

                <h3>Экстренная связь:</h3>
                <p>
                    +375 (XX) XXX-XX-XX
                </p>
                <p>
                    Круглосуточно, только для ситуаций во время проведения экскурсий
                </p>

                <h2>Электронная почта</h2>
                <ul>
                    <li><strong>Общие вопросы:</strong> info@globalgid.by</li>
                    <li><strong>Поддержка клиентов:</strong> support@globalgid.by</li>
                    <li><strong>Для гидов:</strong> guides@globalgid.by</li>
                    <li><strong>Сотрудничество:</strong> partner@globalgid.by</li>
                </ul>

                <h2>Мессенджеры</h2>
                <ul>
                    <li><strong>Telegram:</strong> @globalgid_support</li>
                    <li><strong>WhatsApp/Viber:</strong> +375 (XX) XXX-XX-XX</li>
                </ul>
                <p>
                    Время ответа: до 30 минут в рабочее время
                </p>

                <h2>Социальные сети</h2>
                <ul>
                    <li><strong>Instagram:</strong> @globalgid_by</li>
                    <li style={{ marginLeft: '20px', listStyle: 'none', marginTop: '4px' }}>Истории гидов, красивые локации, анонсы</li>
                    <li><strong>ВКонтакте:</strong> vk.com/globalgid</li>
                    <li style={{ marginLeft: '20px', listStyle: 'none', marginTop: '4px' }}>Новости, специальные предложения, сообщество</li>
                    <li><strong>Telegram-канал:</strong> @globalgid_news</li>
                    <li style={{ marginLeft: '20px', listStyle: 'none', marginTop: '4px' }}>Обновления и полезная информация</li>
                </ul>
            </div>
        </div>
    );
}

