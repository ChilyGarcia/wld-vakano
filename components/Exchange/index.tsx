"use client";

import React, { useState } from "react";

import {
  MiniKit,
  tokenToDecimals,
  Tokens,
  PayCommandInput,
  ResponseEvent,
} from "@worldcoin/minikit-js";
import { useEffect } from "react";
import { IConfiguration } from "@/interfaces/configuration.interface";
import { IOrder } from "@/interfaces/order.interface";

const decimalPattern = /^[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]*)?$/;

export const ExchangeBlock = () => {
  const [step, setStep] = useState(3);
  const [formData, setFormData] = useState({
    sendAmount: 1,
    receiveAmount: 139,
    paymentMethod: "",
    name: "",
    email: "",
    phone: "",
    document_number: "",
    bank_account: "1",
  });

  const [sendValue, setSendValue] = useState("");
  const [receiveValue, setReceiveValue] = useState("");
  const [inverted, setInverted] = useState(1);
  const [configuration, setConfiguration] = useState<IConfiguration>();
  const [body, setBody] = useState<IOrder>();
  const [address, setAddress] = useState("");
  const [response, setResponse] = useState<any>("");
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
    document_number: "",
  });

  const validateField = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "email":
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          error = "El correo electrónico no es válido.";
        }
        break;
      case "phone":
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(value)) {
          error = "El número de teléfono debe tener 10 dígitos.";
        }
        break;
      case "document_number":
        if (value.trim() === "") {
          error = "El número de cuenta no puede estar vacío.";
        }
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    validateField(id, value);
  };

  const fetchStore = async (data: any) => {
    try {
      console.log("Este es el body dentro del fetch", data);
      const response = await fetch("https://wld.lol/api/v1/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":
            "20ae3f163b89fdbb776cdfa4461685dd6e609709fc142a9fe9f41a7810c7cffa",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();

      setAddress(result.address);

      console.log("Este es el store que llega", result);

      setConfiguration(result);

      return result;
    } catch (error) {
      console.error("Hubo un problema con la operación fetch:", error);
      return null;
    }
  };

  useEffect(() => {
    console.log(address);
  }, [address]);

  const fetchConfiguration = async () => {
    try {
      const response = await fetch("https://wld.lol/api/v1/configurations");

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();

      console.log("Esta es la configuración que llega", result);

      setConfiguration(result);

      return result;
    } catch (error) {
      console.error("Hubo un problema con la operación fetch:", error);
      return null;
    }
  };

  const fetchConvert = async (data: any) => {
    console.log("Esta es la data que esta llegando al fetch convert", data);
    try {
      console.log("Haciendo la petición");
      const response = await fetch(
        `https://wld.lol/api/v1/convert?amount=${data.amount}&inverted=${data.inverted}`
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();

      console.log(result);
      return result;
    } catch (error) {
      console.error("Hubo un problema con la operación fetch:", error);
      return null;
    }
  };

  const handleContinue = () => {
    if (step === 1 && formData.paymentMethod) {
      setStep(2);
    }

    const sanitizedReceiveValue = receiveValue.replace(/,/g, "");

    if (inverted === 1) {
      setBody({
        amount: parseFloat(sendValue),
        bank: formData.paymentMethod,
        bank_account: "",
        customer_document_number: "",
        customer_email: formData.email,
        customer_full_name: formData.name,
        customer_phone_number: formData.phone,
        inverted: "1",
        referrals_reference: "WORLDAPP",
      });
    } else {
      setBody({
        amount: parseFloat(sanitizedReceiveValue),
        bank: formData.paymentMethod,
        bank_account: "",
        customer_document_number: "",
        customer_email: formData.email,
        customer_full_name: formData.name,
        customer_phone_number: formData.phone,
        inverted: "0",
        referrals_reference: "WORLDAPP",
      });
    }
  };

  const hasErrors = () => {
    return Object.values(errors).some((error) => error !== "");
  };

  const isFinalStepValid = () => {
    const requiredFields = ["name", "email", "phone", "document_number"];
    const allFieldsFilled = requiredFields.every(
      (field) =>
        typeof formData[field as keyof typeof formData] === "string" &&
        (formData[field as keyof typeof formData] as string).trim() !== ""
    );

    return allFieldsFilled && !hasErrors();
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  useEffect(() => {
    const body = { amount: parseFloat("1"), inverted: 1 };

    fetchConfiguration();

    fetchConvert(body).then((response) => {
      if (response && response.converted) {
        setSendValue("1");
        setReceiveValue(parseFloat(response.converted).toLocaleString("en-US"));
      } else {
        console.error("La respuesta no tiene el formato esperado", response);
      }
    });
  }, []);

  const handleSendChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let inputValue = event.target.value.replace(/,/g, "");

    if (inputValue.match(decimalPattern)) {
      setSendValue(inputValue);

      let body, response;

      if (inputValue.trim() === "") {
        inputValue = "0";
      }

      body = { amount: parseFloat(inputValue), inverted: 1 };
      setInverted(1);
      response = await fetchConvert(body);

      if (response && response.converted) {
        const inputElement = document.getElementById(
          "receive"
        ) as HTMLInputElement;

        if (inputElement) {
          inputElement.value = parseFloat(response.converted).toLocaleString(
            "en-US"
          );
        }

        setReceiveValue(parseFloat(response.converted).toLocaleString("en-US"));
      } else {
        console.error("La respuesta no tiene el formato esperado", response);
      }
    }
  };

  const handleReceiveChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let inputValue = event.target.value.replace(/,/g, "");

    const formattedValue = parseFloat(inputValue).toLocaleString("en-US");
    setReceiveValue(formattedValue);

    let body, response;

    if (inputValue.trim() === "") {
      inputValue = "0";
      setReceiveValue("0");
    }

    body = { amount: parseFloat(inputValue), inverted: 0 };
    response = await fetchConvert(body);
    setInverted(0);

    const inputElement = document.getElementById("send") as HTMLInputElement;

    if (inputElement && response) {
      inputElement.value = response.converted;
    }

    setSendValue(response.converted);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    setErrors((prev) => ({ ...prev, [id]: "" }));
    setBody((prevState) => ({
      ...prevState,
      customer_full_name: formData.name,
      amount: prevState?.amount || 0,
      bank: prevState?.bank || "",
      customer_document_number: formData.document_number,
      customer_email: formData.email,
      customer_phone_number: formData.phone,
      inverted: prevState?.inverted || "0",
      bank_account: formData.bank_account,
      referrals_reference: prevState?.referrals_reference || "",
    }));
  };

  useEffect(() => {
    setBody((prevState) => ({
      ...prevState,
      customer_full_name: formData.name,
      amount: prevState?.amount || 0,
      bank: prevState?.bank || "",
      customer_document_number: formData.document_number,
      customer_email: formData.email,
      customer_phone_number: formData.phone,
      inverted: prevState?.inverted || "0",
      bank_account: formData.bank_account,
      referrals_reference: prevState?.referrals_reference || "",
    }));
  }, [formData]);

  useEffect(() => {
    setTimeout(() => {
      if (MiniKit.isInstalled()) {
      } else {
        const environment = window.location.origin;
        const userAgent = navigator.userAgent;
        const errorMessage = `MiniKit no está instalado. 
          Environment: ${environment}, 
          User Agent: ${userAgent}`;
        console.error(errorMessage);
      }
    }, 100);

    // Suscribe a los eventos de respuesta de pago
    MiniKit.subscribe(ResponseEvent.MiniAppPayment, async (response) => {
      if (response.status === "success") {
        try {
          const res = await fetch(`/api/confirm-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await res.json();

          if (result.success) {
            alert("¡Pago exitoso!");
          } else {
            const errorMessage = "Error al confirmar el pago.";

            alert(errorMessage);
          }
        } catch (error) {
          console.error("Error al procesar la respuesta del pago:", error);
        }
      } else {
        console.log("Estado de pago no exitoso", response);
      }
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppPayment);
    };
  }, []);

  const sendPayment = async (address: any) => {
    try {
      const res = await fetch(`/api/initiate-payment`, {
        method: "POST",
      });

      const { id } = await res.json();

      console.log(id);

      const payload = {
        reference: id,
        to: address,
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(
              body?.amount ?? 0,
              Tokens.WLD
            ).toString(),
          },
        ],
        description: "Watch this is a test",
      };

      console.log("Payload", payload);

      if (MiniKit.isInstalled()) {
        return await MiniKit.commandsAsync.pay(payload);
      }
      return null;
    } catch (error) {
      console.error("Error sending payment", error);

      setStep(3);
      return null;
    }
  };

  const handlePay = async () => {
    if (!MiniKit.isInstalled()) {
      console.error("MiniKit is not installed");
      return;
    }

    try {
      const result = await fetchStore(body);

      if (!result || !result.address) {
        console.error("No se pudo obtener la dirección del store");
        setResponse("error");
        setStep(3);
        return;
      }

      const address = result.address;

      const sendPaymentResponse = await sendPayment(address);

      const response = sendPaymentResponse?.finalPayload;
      if (!response) {
        setResponse("error");
        setStep(3);
        return;
      }

      if (response.status === "success") {
        setResponse("success");
        setStep(3);
      }

      // if (response.status === "success") {
      //   const res = await fetch(
      //     `${process.env.NEXTAUTH_URL}/api/confirm-payment`,
      //     {
      //       method: "POST",
      //       headers: { "Content-Type": "application/json" },
      //       body: JSON.stringify({ payload: response }),
      //     }
      //   );
      //   const payment = await res.json();
      //   if (payment.success) {
      //     console.log("SUCCESS!");

      //     setResponse("success");
      //     setStep(3);
      //   } else {
      //     setResponse("error");

      //     setStep(3);
      //     console.log("FAILED!");
      //   }
      // }
    } catch (error) {
      console.error("Error during payment process", error);

      setResponse("error");
      setStep(3);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSendValue("1");
    setReceiveValue("");
    setInverted(1);
    setConfiguration(undefined);
    setBody(undefined);
    setAddress("");

    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-[460px] bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-10">
          <div className="flex items-center">
            <div
              className={`rounded-full w-10 h-10 flex items-center justify-center font-medium ${
                step === 1
                  ? "bg-[#14162c] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div className="w-20 h-[2px] bg-gray-200 mx-2" />
            <div
              className={`rounded-full w-10 h-10 flex items-center justify-center font-medium ${
                step === 2
                  ? "bg-[#14162c] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>

            <div className="w-20 h-[2px] bg-gray-200 mx-2" />
            <div
              className={`rounded-full w-10 h-10 flex items-center justify-center font-medium ${
                step === 3
                  ? "bg-[#14162c] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 mb-8">
              <h2 className="text-xl text-black font-medium">
                Intercambio wld
              </h2>

              <img src="/icon/wld-icon.png" className="w-4"></img>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg">
                <div className="px-4 py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">
                    ENVÍAS
                  </span>
                </div>
                <div className="p-4 flex items-center">
                  <div className="flex items-center gap-2">
                    <img src="/icon/wld-icon.png" className="w-8"></img>
                  </div>
                  <input
                    name="sendAmount"
                    type="number"
                    value={sendValue}
                    onChange={handleSendChange}
                    className="ml-auto w-24 text-right text-black border-0 p-0 text-lg font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg">
                <div className="px-4 py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">
                    RECIBES
                  </span>
                </div>
                <div className="p-4 flex items-center">
                  <div className="flex items-center gap-2">
                    <img src="/icon/colombia-icon.png" className="w-8"></img>
                  </div>
                  <input
                    name="receiveAmount"
                    type="text"
                    onChange={handleReceiveChange}
                    value={receiveValue}
                    className="ml-auto w-24 text-right text-black border-0 p-0 text-lg font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Método de consignación
              </label>
              <div className="relative">
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none"
                >
                  {configuration?.payment_methods?.map((method) => (
                    <option key={method[0]} value={method[0]}>
                      {method[1]}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              className={`w-full py-4 px-4 rounded-lg font-medium ${
                formData.paymentMethod
                  ? "bg-[#14162c] hover:bg-[#14162c]/90 text-white"
                  : "bg-gray-300 text-white cursor-not-allowed"
              }`}
              onClick={handleContinue}
              disabled={!formData.paymentMethod}
            >
              CONTINUAR
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-center mb-6">
              Información Personal
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ingrese su nombre completo"
                  className="mt-1 block text-black w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="Ingrese su correo electrónico"
                    className={`mt-1 block text-black w-full px-3 py-2 bg-white border ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-sm">{errors.email}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="Ingrese su número de teléfono"
                    className={`mt-1 block w-full px-3 text-black py-2 bg-white border ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.phone && (
                    <span className="text-red-500 text-sm">{errors.phone}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="document_number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Número de cuenta
                  </label>
                  <input
                    id="document_number"
                    type="text"
                    value={formData.document_number}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="Ingrese su número de cuenta"
                    className={`mt-1 block text-black w-full px-3 py-2 bg-white border ${
                      errors.document_number
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.document_number && (
                    <span className="text-red-500 text-sm">
                      {errors.document_number}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Tipo de cuenta
                </label>
                <div className="relative">
                  <select
                    value={formData.bank_account}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bank_account: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none"
                  >
                    {configuration?.bank_types?.map((method) => (
                      <option key={method[0]} value={method[0]}>
                        {method[1]}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-lg"
                onClick={handleBack}
              >
                Atrás
              </button>
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium ${
                  isFinalStepValid()
                    ? "bg-[#14162c] hover:bg-[#14162c]/90 text-white"
                    : "bg-gray-300 text-gray-400 cursor-not-allowed"
                }`}
                onClick={handlePay}
                disabled={!isFinalStepValid()}
              >
                Finalizar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="text-center space-y-6">
              <h2 className="text-xl text-black font-medium">
                {response === "success"
                  ? "Orden realizada con éxito"
                  : "Algo ha salido mal"}
              </h2>

              {response === "success" ? (
                <>
                  <p className="text-black text-justify">
                    Gracias por confiar en nosotros, a continuacion recibiras un
                    correo electronico con los detalles de la orden, para mas
                    informacion, puede visitar nuestro canal de telegram para
                    poder recibir soporte sobre la orden que acabaste de
                    realizar con nosotros
                  </p>
                </>
              ) : (
                <>
                  <p className="text-black text-justify">
                    Algo ha salido mal en la orden, lamentamos lo sucedido. Para
                    saber mas informacion por favor comuniquese con nosotros por
                    nuestros canales de comunicacion de telegram
                  </p>
                </>
              )}

              <button
                className="w-full bg-blue-400 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg mt-4"
                onClick={() => (window.location.href = "https://t.me/WLD_LOL")}
              >
                <div className="flex justify-center items-center w-full">
                  <div className="mr-6">
                    <svg
                      width="20px"
                      height="20px"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs></defs>
                      <path
                        fill="white"
                        d="M40.83,8.48c1.14,0,2,1,1.54,2.86l-5.58,26.3c-.39,1.87-1.52,2.32-3.08,1.45L20.4,29.26a.4.4,0,0,1,0-.65L35.77,14.73c.7-.62-.15-.92-1.07-.36L15.41,26.54a.46.46,0,0,1-.4.05L6.82,24C5,23.47,5,22.22,7.23,21.33L40,8.69a2.16,2.16,0,0,1,.83-.21Z"
                      />
                    </svg>
                  </div>
                  <div>Contactar por telegram</div>
                </div>
              </button>

              <button
                className="w-full bg-[#14162c] hover:bg-[#14162c]/90 text-white font-medium py-2 px-4 rounded-lg"
                onClick={handleReset}
              >
                Volver al inicio
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
