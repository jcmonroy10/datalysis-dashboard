import { buildFilters } from "../../infrastructure/db/buildFilters";

describe("buildFilters", () => {

  it("returns empty conditions and params when filters are empty", () => {
    const { conditions, params } = buildFilters({}, 3);
    expect(conditions).toHaveLength(0);
    expect(params).toHaveLength(0);
  });

  it("builds IN clause for a single status value", () => {
    const { conditions, params } = buildFilters({ status: ["delivered"] }, 3);
    expect(conditions).toContain("o.order_status IN ($3)");
    expect(params).toEqual(["delivered"]);
  });

  it("builds IN clause for multiple status values", () => {
    const { conditions, params } = buildFilters(
      { status: ["delivered", "canceled"] },
      3
    );
    expect(conditions).toContain("o.order_status IN ($3,$4)");
    expect(params).toEqual(["delivered", "canceled"]);
  });

  it("builds correct placeholders for multiple filters combined", () => {
    const { conditions, params } = buildFilters(
      {
        state: ["SP"],
        category: ["informatica_acessorios"],
        status: ["delivered"],
      },
      3
    );
    expect(conditions).toContain("c.customer_state IN ($3)");
    expect(conditions).toContain("p.product_category_name IN ($4)");
    expect(conditions).toContain("o.order_status IN ($5)");
    expect(params).toEqual(["SP", "informatica_acessorios", "delivered"]);
  });

  it("ignores empty arrays for a filter key", () => {
    const { conditions, params } = buildFilters(
      { state: [], category: [], status: ["canceled"] },
      3
    );
    expect(conditions).toHaveLength(1);
    expect(conditions).toContain("o.order_status IN ($3)");
    expect(params).toEqual(["canceled"]);
  });

});