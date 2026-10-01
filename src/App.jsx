import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );

    const [clients, setClients] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [showInvoiceForm, setShowInvoiceForm] = useState(false);

    const [selectedClient, setSelectedClient] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [invoiceMessage, setInvoiceMessage] = useState("");

    const [payingInvoice, setPayingInvoice] = useState(null);
    const [downloadingInvoice, setDownloadingInvoice] = useState(null);

    const [unauthorized, setUnauthorized] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setUser(data.user);
            setUnauthorized(false);

        } catch (error) {
            setMessage("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setEmail("");
        setPassword("");
        setInvoices([]);
        setSelectedInvoice(null);
        setUnauthorized(false);
    };

    const getClients = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/invoices/clients",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 401 || response.status === 403) {
                setUnauthorized(true);
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setClients(data);
            }

        } catch (error) {
            console.log("Could not load clients");
        }
    };

    const getInvoices = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/invoices",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 401) {
                handleLogout();
                return;
            }

            if (response.status === 403) {
                setUnauthorized(true);
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setInvoices(data);
            }

        } catch (error) {
            console.log("Could not load invoices");
        }
    };

    const getInvoiceDetails = async (invoiceId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/invoices/${invoiceId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 401) {
                handleLogout();
                return;
            }

            if (response.status === 403) {
                setUnauthorized(true);
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Could not load invoice");
                return;
            }

            setSelectedInvoice(data);

        } catch (error) {
            alert("Unable to load invoice details");
        }
    };

    const openInvoiceForm = () => {
        setShowInvoiceForm(true);
        setInvoiceMessage("");
        getClients();
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();

        setInvoiceMessage("");

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/invoices",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        client: selectedClient,
                        amount: Number(amount),
                        description
                    })
                }
            );

            if (response.status === 403) {
                setUnauthorized(true);
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                setInvoiceMessage(data.message);
                return;
            }

            setInvoiceMessage("Invoice created successfully!");

            setSelectedClient("");
            setAmount("");
            setDescription("");

            getInvoices();

        } catch (error) {
            setInvoiceMessage("Unable to create invoice");
        }
    };

    const handlePayInvoice = async (invoiceId) => {
        if (payingInvoice) {
            return;
        }

        setPayingInvoice(invoiceId);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/invoices/${invoiceId}/checkout`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 403) {
                setUnauthorized(true);
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            }

        } catch (error) {
            alert("Unable to connect to payment server");
        } finally {
            setPayingInvoice(null);
        }
    };

    const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
        if (downloadingInvoice) {
            return;
        }

        setDownloadingInvoice(invoiceId);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/invoices/${invoiceId}/pdf`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 401) {
                handleLogout();
                return;
            }

            if (response.status === 403) {
                setUnauthorized(true);
                return;
            }

            if (!response.ok) {
                const data = await response.json();

                alert(data.message || "Could not download PDF");

                return;
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = `${invoiceNumber}.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {
            alert("Unable to download PDF");
        } finally {
            setDownloadingInvoice(null);
        }
    };

    useEffect(() => {
        if (user) {
            getInvoices();

            if (user.role === "Admin") {
                getClients();
            }
        }
    }, [user]);

    if (unauthorized) {
        return (
            <div className="unauthorized-page">

                <div className="unauthorized-box">

                    <h1>403</h1>

                    <h2>Unauthorized</h2>

                    <p>
                        You do not have permission to access
                        this page.
                    </p>

                    <button
                        onClick={() => {
                            setUnauthorized(false);
                            setSelectedInvoice(null);
                        }}
                    >
                        Back to Dashboard
                    </button>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </div>
        );
    }

    if (user && selectedInvoice) {
        return (
            <div className="dashboard">

                <nav className="navbar">
                    <h2>VaultPay</h2>

                    <button onClick={handleLogout}>
                        Logout
                    </button>
                </nav>

                <div className="dashboard-content">

                    <button
                        className="back-button"
                        onClick={() => setSelectedInvoice(null)}
                    >
                        ← Back to Dashboard
                    </button>

                    <div className="invoice-detail">

                        <h1>Invoice Details</h1>

                        <div className="invoice-detail-box">

                            <h2>
                                {selectedInvoice.invoiceNumber}
                            </h2>

                            <p>
                                <strong>Status:</strong>{" "}
                                {selectedInvoice.status}
                            </p>

                            <p>
                                <strong>Client:</strong>{" "}
                                {selectedInvoice.client?.name}
                            </p>

                            <p>
                                <strong>Email:</strong>{" "}
                                {selectedInvoice.client?.email}
                            </p>

                            <p>
                                <strong>Description:</strong>{" "}
                                {selectedInvoice.description}
                            </p>

                            <p>
                                <strong>Amount:</strong>{" "}
                                ${selectedInvoice.amount}
                            </p>

                            <p>
                                <strong>Created:</strong>{" "}
                                {new Date(
                                    selectedInvoice.createdAt
                                ).toLocaleDateString()}
                            </p>

                            <button
                                onClick={() =>
                                    handleDownloadPDF(
                                        selectedInvoice._id,
                                        selectedInvoice.invoiceNumber
                                    )
                                }
                                disabled={
                                    downloadingInvoice ===
                                    selectedInvoice._id
                                }
                            >
                                {downloadingInvoice ===
                                selectedInvoice._id
                                    ? "Downloading..."
                                    : "Download PDF"}
                            </button>

                            {user.role === "Client" &&
                                selectedInvoice.status === "Pending" && (
                                    <button
                                        className="pay-button"
                                        onClick={() =>
                                            handlePayInvoice(
                                                selectedInvoice._id
                                            )
                                        }
                                        disabled={
                                            payingInvoice ===
                                            selectedInvoice._id
                                        }
                                    >
                                        {payingInvoice ===
                                        selectedInvoice._id
                                            ? "Processing..."
                                            : "Pay Invoice"}
                                    </button>
                                )}

                        </div>

                    </div>

                </div>
            </div>
        );
    }

    if (user) {
        return (
            <div className="dashboard">

                <nav className="navbar">
                    <h2>VaultPay</h2>

                    <button onClick={handleLogout}>
                        Logout
                    </button>
                </nav>

                <div className="dashboard-content">

                    {user.role === "Admin" ? (
                        <>
                            <h1>Admin Dashboard</h1>

                            <p>Welcome, {user.name}</p>

                            <div className="dashboard-cards">

                                <div className="card">
                                    <h3>Total Clients</h3>
                                    <p>{clients.length}</p>
                                </div>

                                <div className="card">
                                    <h3>Total Invoices</h3>
                                    <p>{invoices.length}</p>
                                </div>

                                <div className="card">
                                    <h3>Total Revenue</h3>

                                    <p>
                                        $
                                        {invoices
                                            .filter(
                                                (invoice) =>
                                                    invoice.status === "Paid"
                                            )
                                            .reduce(
                                                (total, invoice) =>
                                                    total + invoice.amount,
                                                0
                                            )}
                                    </p>
                                </div>

                            </div>

                            <button
                                className="create-button"
                                onClick={openInvoiceForm}
                            >
                                Create New Invoice
                            </button>

                            {showInvoiceForm && (
                                <div className="invoice-form">

                                    <h2>Create Invoice</h2>

                                    <form onSubmit={handleCreateInvoice}>

                                        <label>Client</label>

                                        <select
                                            value={selectedClient}
                                            onChange={(e) =>
                                                setSelectedClient(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select a client
                                            </option>

                                            {clients.map((client) => (
                                                <option
                                                    key={client._id}
                                                    value={client._id}
                                                >
                                                    {client.name} - {client.email}
                                                </option>
                                            ))}
                                        </select>

                                        <label>Amount</label>

                                        <input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={amount}
                                            onChange={(e) =>
                                                setAmount(e.target.value)
                                            }
                                            min="1"
                                            required
                                        />

                                        <label>Description</label>

                                        <textarea
                                            placeholder="Enter invoice description"
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            required
                                        />

                                        <button type="submit">
                                            Create Invoice
                                        </button>

                                        {invoiceMessage && (
                                            <p className="invoice-message">
                                                {invoiceMessage}
                                            </p>
                                        )}

                                    </form>

                                </div>
                            )}

                            <div className="invoice-list">

                                <h2>All Invoices</h2>

                                {invoices.length === 0 ? (
                                    <p>No invoices found.</p>
                                ) : (
                                    invoices.map((invoice) => (
                                        <div
                                            className="invoice-card"
                                            key={invoice._id}
                                        >
                                            <h3>
                                                {invoice.invoiceNumber}
                                            </h3>

                                            <p>
                                                Client:{" "}
                                                {invoice.client?.name}
                                            </p>

                                            <p>
                                                Amount: $
                                                {invoice.amount}
                                            </p>

                                            <p>
                                                Status:{" "}
                                                {invoice.status}
                                            </p>

                                            <button
                                                onClick={() =>
                                                    getInvoiceDetails(
                                                        invoice._id
                                                    )
                                                }
                                            >
                                                View Details
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDownloadPDF(
                                                        invoice._id,
                                                        invoice.invoiceNumber
                                                    )
                                                }
                                                disabled={
                                                    downloadingInvoice ===
                                                    invoice._id
                                                }
                                            >
                                                {downloadingInvoice ===
                                                invoice._id
                                                    ? "Downloading..."
                                                    : "Download PDF"}
                                            </button>

                                        </div>
                                    ))
                                )}

                            </div>
                        </>
                    ) : (
                        <>
                            <h1>Client Dashboard</h1>

                            <p>Welcome, {user.name}</p>

                            <h2>Your Invoices</h2>

                            {invoices.length === 0 ? (
                                <div className="card">
                                    <p>No invoices found.</p>
                                </div>
                            ) : (
                                <div className="invoice-list">

                                    {invoices.map((invoice) => (
                                        <div
                                            className="invoice-card"
                                            key={invoice._id}
                                        >
                                            <h3>
                                                {invoice.invoiceNumber}
                                            </h3>

                                            <p>
                                                Amount: $
                                                {invoice.amount}
                                            </p>

                                            <p>
                                                Description:{" "}
                                                {invoice.description}
                                            </p>

                                            <p>
                                                Status:{" "}
                                                {invoice.status}
                                            </p>

                                            <button
                                                onClick={() =>
                                                    getInvoiceDetails(
                                                        invoice._id
                                                    )
                                                }
                                            >
                                                View Details
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDownloadPDF(
                                                        invoice._id,
                                                        invoice.invoiceNumber
                                                    )
                                                }
                                                disabled={
                                                    downloadingInvoice ===
                                                    invoice._id
                                                }
                                            >
                                                {downloadingInvoice ===
                                                invoice._id
                                                    ? "Downloading..."
                                                    : "Download PDF"}
                                            </button>

                                            {invoice.status === "Pending" && (
                                                <button
                                                    className="pay-button"
                                                    onClick={() =>
                                                        handlePayInvoice(
                                                            invoice._id
                                                        )
                                                    }
                                                    disabled={
                                                        payingInvoice ===
                                                        invoice._id
                                                    }
                                                >
                                                    {payingInvoice ===
                                                    invoice._id
                                                        ? "Processing..."
                                                        : "Pay Invoice"}
                                                </button>
                                            )}

                                        </div>
                                    ))}

                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>
        );
    }

    return (
        <div className="login-page">

            <div className="login-box">

                <h1>VaultPay</h1>

                <p className="subtitle">
                    Secure Financial Portal
                </p>

                <form onSubmit={handleLogin}>

                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {message && (
                        <p className="login-message">
                            {message}
                        </p>
                    )}

                </form>

            </div>

        </div>
    );
}

export default App;