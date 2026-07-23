import { useEffect, useMemo, useState } from "react";
import { getMyOrders } from "../../services/orderService";
import "./History.css";

function formatCurrency(value) {
	return `$${Number(value || 0).toFixed(2)}`;
}

function formatOrderDate(value) {
	if (!value) {
		return "Fecha no disponible";
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "Fecha no disponible"
		: date.toLocaleString("es-CR");
}

function History() {
	const [orders, setOrders] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const loadOrders = async () => {
			setIsLoading(true);
			setError("");

			try {
				const response = await getMyOrders();
				const nextOrders = Array.isArray(response?.pedidos) ? response.pedidos : [];
				setOrders(nextOrders);
			} catch (requestError) {
				setError(requestError?.message || "No fue posible cargar tus pedidos.");
			} finally {
				setIsLoading(false);
			}
		};

		loadOrders();
	}, []);

	const totalOrders = orders.length;
	const totalAmount = useMemo(
		() => orders.reduce((sum, order) => sum + (Number(order?.total) || 0), 0),
		[orders]
	);

	return (
		<section className="history-page container">
			<header className="history-header">
				<span className="history-eyebrow">Mi cuenta</span>
				<h1>Mis pedidos</h1>
				<p>Consulta el historial de compras registradas en tu cuenta.</p>
			</header>

			<div className="history-summary">
				<article>
					<strong>{totalOrders}</strong>
					<span>Pedidos</span>
				</article>
				<article>
					<strong>{formatCurrency(totalAmount)}</strong>
					<span>Total comprado</span>
				</article>
			</div>

			{isLoading && <p className="history-status">Cargando pedidos...</p>}
			{!isLoading && error && <p className="history-error">{error}</p>}

			{!isLoading && !error && orders.length === 0 && (
				<div className="history-empty">
					<h2>Aun no tienes pedidos</h2>
					<p>Cuando finalices una compra, aparecera aqui con su detalle.</p>
				</div>
			)}

			{!isLoading && !error && orders.length > 0 && (
				<div className="history-list">
					{orders.map((order) => {
						const details = Array.isArray(order?.detalle) ? order.detalle : [];

						return (
							<article className="history-card" key={order.idPedido}>
								<div className="history-card-head">
									<div>
										<h2>Pedido #{order.idPedido}</h2>
										<p>{formatOrderDate(order.fechaPedido)}</p>
									</div>
									<span className="history-state">{order.estado || "Sin estado"}</span>
								</div>

								<div className="history-card-meta">
									<p>
										<strong>Entrega:</strong> {order.direccionEntrega || "No definida"}
									</p>
									<p>
										<strong>Total:</strong> {formatCurrency(order.total)}
									</p>
								</div>

								<div className="history-items">
									{details.map((item) => (
										<div className="history-item" key={item.idDetallePedido}>
											<div>
												<h3>{item.nombre || `Producto ${item.idProducto}`}</h3>
												<p>
													Cantidad: {item.cantidad} | Unitario: {formatCurrency(item.precioUnitario)}
												</p>
											</div>
											<strong>{formatCurrency(item.subtotal)}</strong>
										</div>
									))}
								</div>
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
}

export default History;
