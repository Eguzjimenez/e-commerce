const chatbotResponses = [
    {
        keywords: [
            "hola",
            "buenas",
            "buenos dias",
            "buenas tardes",
            "buenas noches",
            "hey"
        ],
        response:
            "¡Hola! 👋 Soy el asistente virtual de ConcreInnova. Puedo ayudarte con información sobre productos, pedidos, pagos, cotizaciones, envíos y contacto."
    },

    {
        keywords: [
            "pago",
            "pagos",
            "metodo de pago",
            "metodos de pago",
            "formas de pago",
            "como pagar",
            "tarjeta",
            "sinpe"
        ],
        response:
            "💳 En ConcreInnova puedes realizar tus pagos mediante tarjeta de crédito o débito y SINPE Móvil. El método disponible se mostrará durante el proceso de compra."
    },

    {
        keywords: [
            "contacto",
            "contactar",
            "telefono",
            "teléfono",
            "correo",
            "email",
            "correo electronico",
            "correo electrónico"
        ],
        response:
            "📞 Puedes contactar a ConcreInnova mediante nuestro teléfono 8888-1111 o por correo electrónico a contacto@concreinnova.com."
    },

    {
        keywords: [
            "horario",
            "horarios",
            "abierto",
            "atencion",
            "atención",
            "cuando atienden"
        ],
        response:
            "🕐 Nuestro horario de atención es de lunes a viernes de 8:00 a.m. a 5:00 p.m."
    },

    {
        keywords: [
            "ubicacion",
            "ubicación",
            "direccion",
            "dirección",
            "donde estan",
            "dónde están",
            "lugar"
        ],
        response:
            "📍 ConcreInnova ofrece sus servicios en Costa Rica. Para obtener información específica sobre nuestra ubicación, puedes comunicarte con nuestro equipo de atención."
    },

    {
        keywords: [
            "producto",
            "productos",
            "catalogo",
            "catálogo",
            "que venden",
            "qué venden"
        ],
        response:
            "🏗️ En ConcreInnova puedes encontrar productos decorativos y soluciones elaboradas en concreto. Puedes consultar nuestro catálogo para conocer los productos disponibles, sus características y precios."
    },

    {
        keywords: [
            "precio",
            "precios",
            "cuanto cuesta",
            "cuánto cuesta",
            "valor",
            "costo",
            "costos"
        ],
        response:
            "💰 Los precios dependen del producto, sus características y opciones de personalización. Puedes consultar el precio directamente desde el detalle de cada producto."
    },

    {
        keywords: [
            "comprar",
            "compra",
            "como comprar",
            "cómo comprar",
            "hacer compra"
        ],
        response:
            "🛒 Para realizar una compra, selecciona el producto que deseas, agrega la cantidad al carrito y luego continúa al proceso de checkout para completar tu pedido."
    },

    {
        keywords: [
            "carrito",
            "carrito de compras",
            "agregar al carrito"
        ],
        response:
            "🛒 Puedes agregar productos al carrito desde su página de detalle. Después puedes revisar las cantidades y continuar al proceso de compra."
    },

    {
        keywords: [
            "pedido",
            "pedidos",
            "orden",
            "ordenes",
            "órdenes",
            "mi pedido",
            "mis pedidos"
        ],
        response:
            "📦 Puedes consultar tus pedidos desde la sección 'Mis pedidos'. Allí podrás revisar la información y los detalles de las compras realizadas."
    },

    {
        keywords: [
            "estado del pedido",
            "estado pedido",
            "seguimiento",
            "seguimiento pedido",
            "donde esta mi pedido",
            "dónde está mi pedido"
        ],
        response:
            "📦 Para consultar el estado de tu pedido, ingresa a la sección 'Mis pedidos' de tu cuenta. Si necesitas ayuda adicional, puedes contactar a nuestro equipo de soporte."
    },

    {
        keywords: [
            "envio",
            "envíos",
            "envio",
            "entrega",
            "entregas",
            "tiempo de entrega"
        ],
        response:
            "🚚 Los tiempos de entrega pueden variar dependiendo del producto, cantidad y ubicación. Para obtener información específica sobre tu pedido, consulta sus detalles o contacta con soporte."
    },

    {
        keywords: [
            "cotizacion",
            "cotización",
            "cotizaciones",
            "presupuesto",
            "presupuestos"
        ],
        response:
            "📋 ConcreInnova permite solicitar cotizaciones para productos o necesidades específicas. Puedes utilizar el módulo de cotizaciones para enviar tu solicitud y recibir una respuesta."
    },

    {
        keywords: [
            "personalizar",
            "personalizacion",
            "personalización",
            "personalizado",
            "personalizados",
            "medidas",
            "tamaño"
        ],
        response:
            "🎨 Algunos productos pueden contar con opciones de personalización. Puedes revisar las características disponibles en el detalle del producto o solicitar una cotización para necesidades específicas."
    },

    {
        keywords: [
            "stock",
            "disponibilidad",
            "disponible",
            "existencias",
            "hay disponible"
        ],
        response:
            "📦 La disponibilidad de cada producto se muestra en su página de detalle. Si un producto no está disponible, puedes contactar con nosotros para consultar cuándo volverá a estar disponible."
    },

    {
        keywords: [
            "cancelar",
            "cancelacion",
            "cancelación",
            "cancelar pedido"
        ],
        response:
            "❌ Para solicitar la cancelación de un pedido, te recomendamos contactar con nuestro equipo de soporte indicando el número de pedido y el motivo de la solicitud."
    },

    {
        keywords: [
            "devolucion",
            "devolución",
            "devolver",
            "reembolso",
            "reembolsar"
        ],
        response:
            "↩️ Para consultas sobre devoluciones o reembolsos, contacta con nuestro equipo de soporte indicando los detalles de tu pedido para revisar tu caso."
    },

    {
        keywords: [
            "soporte",
            "ayuda",
            "ayudame",
            "ayúdame",
            "problema",
            "problemas"
        ],
        response:
            "🛠️ Claro, puedo ayudarte. Puedes preguntarme sobre productos, pedidos, pagos, cotizaciones, envíos o información de contacto. Si tu problema requiere atención personalizada, puedes comunicarte con nuestro equipo de soporte."
    },

    {
        keywords: [
            "gracias",
            "muchas gracias",
            "thank you"
        ],
        response:
            "¡Con mucho gusto! 😊 Estamos para ayudarte. ¿Necesitas información sobre algún producto, pedido o servicio?"
    },

    {
        keywords: [
            "adios",
            "adiós",
            "chao",
            "hasta luego"
        ],
        response:
            "¡Hasta luego! 👋 Gracias por visitar ConcreInnova. Esperamos ayudarte nuevamente."
    }
];


export function getBotResponse(message) {

    const normalizedMessage = message
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    let bestMatch = null;
    let highestScore = 0;

    chatbotResponses.forEach((item) => {

        let score = 0;

        item.keywords.forEach((keyword) => {

            const normalizedKeyword = keyword
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            if (normalizedMessage.includes(normalizedKeyword)) {
                score++;
            }
        });

        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    });

    if (bestMatch) {
        return bestMatch.response;
    }

    return "🤖 No estoy seguro de cómo responder esa pregunta. Puedes preguntarme sobre métodos de pago, productos, pedidos, cotizaciones, envíos, horarios o información de contacto.";
}