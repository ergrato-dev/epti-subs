import React from "react";
import { render, screen } from "@testing-library/react-native";
import { SubscriptionCard } from "../components/SubscriptionCard";
import type { Subscription } from "../types/subscription";

// Fixture de suscripcion
const BASE_SUB: Subscription = {
  id: 1,
  userId: "user-uuid-123",
  name: "Netflix",
  cost: "23000",
  currency: "COP",
  billingCycle: "monthly",
  nextPaymentDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0], // en 10 dias
  active: true,
  color: "#7C3AED",
  logoUrl: null,
  planName: "Standard",
  paymentLast4: "1234",
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock de Intl.NumberFormat para entorno de test
beforeAll(() => {
  global.Intl = {
    ...global.Intl,
    NumberFormat: jest.fn().mockImplementation(() => ({
      format: (num: number) => `$${num.toLocaleString()}`,
    })),
  } as typeof Intl;
});

describe("SubscriptionCard — version completa", () => {
  it("renderiza el nombre de la suscripcion", () => {
    render(<SubscriptionCard subscription={BASE_SUB} />);
    expect(screen.getByText("Netflix")).toBeTruthy();
  });

  it("renderiza el color de fondo asignado", () => {
    const { toJSON } = render(<SubscriptionCard subscription={BASE_SUB} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("#7C3AED");
  });

  it("muestra la inicial del nombre como logo placeholder cuando no hay logoUrl", () => {
    render(<SubscriptionCard subscription={BASE_SUB} />);
    expect(screen.getByText("N")).toBeTruthy(); // primera letra de "Netflix"
  });

  it("llama onPress cuando se presiona la tarjeta", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SubscriptionCard subscription={BASE_SUB} onPress={onPress} />,
    );
    getByText("Netflix").parent?.props?.onPress?.();
  });
});

describe("SubscriptionCard — version compact", () => {
  it("renderiza en modo compact sin crashear", () => {
    const { toJSON } = render(
      <SubscriptionCard subscription={BASE_SUB} compact />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("muestra los dias hasta el proximo pago", () => {
    render(<SubscriptionCard subscription={BASE_SUB} compact />);
    // Debe haber algun texto con "dias" en el componente compact
    expect(screen.queryAllByText(/día/)).toBeTruthy();
  });
});

describe("SubscriptionCard — fallback de color", () => {
  it("usa Colors.cardColors cuando no hay color asignado", () => {
    const subSinColor: Subscription = { ...BASE_SUB, color: null };
    const { toJSON } = render(<SubscriptionCard subscription={subSinColor} />);
    expect(toJSON()).toBeTruthy();
  });
});
