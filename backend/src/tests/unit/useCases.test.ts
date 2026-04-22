import { getKpis } from "../../application/use-cases/getKpis";
import { getTopProducts } from "../../application/use-cases/getTopProducts";
import { getRevenueTrend } from "../../application/use-cases/getRevenueTrend";
import { SalesRepository } from "../../domain/repositories/sales.repository";

// Mock repo
const mockRepo: jest.Mocked<SalesRepository> = {
  getKpis: jest.fn(),
  getTopProducts: jest.fn(),
  getRevenueTrend: jest.fn(),
  getSalesByState: jest.fn(),
  getFilterOptions: jest.fn(),
};

describe("getKpis use case", () => {

  beforeEach(() => jest.clearAllMocks());

  it("calls repo.getKpis with correct params", async () => {
    mockRepo.getKpis.mockResolvedValue([{ gmv: 1000 }]);

    const result = await getKpis(mockRepo, "2017-01-01", "2018-01-01", { status: ["delivered"] });

    expect(mockRepo.getKpis).toHaveBeenCalledTimes(1);
    expect(mockRepo.getKpis).toHaveBeenCalledWith(
      "2017-01-01",
      "2018-01-01",
      { status: ["delivered"] }
    );
    expect(result).toEqual([{ gmv: 1000 }]);
  });

  it("returns empty array when repo returns no data", async () => {
    mockRepo.getKpis.mockResolvedValue([]);
    const result = await getKpis(mockRepo, "2017-01-01", "2018-01-01");
    expect(result).toEqual([]);
  });

});

describe("getTopProducts use case", () => {

  beforeEach(() => jest.clearAllMocks());

  it("calls repo.getTopProducts with correct params", async () => {
    mockRepo.getTopProducts.mockResolvedValue([{ product_category_name: "electronics", value: 5000 }]);

    const result = await getTopProducts(mockRepo, "2017-01-01", "2018-01-01", "revenue", 10);

    expect(mockRepo.getTopProducts).toHaveBeenCalledWith(
      "2017-01-01",
      "2018-01-01",
      "revenue",
      10,
      undefined
    );
    expect(result).toHaveLength(1);
  });

});

describe("getRevenueTrend use case", () => {

  beforeEach(() => jest.clearAllMocks());

  it("calls repo.getRevenueTrend with correct params", async () => {
    mockRepo.getRevenueTrend.mockResolvedValue([{ period: "2017-01-01", revenue: 1000, orders: 10 }]);

    const result = await getRevenueTrend(mockRepo, "2017-01-01", "2018-01-01", "day");

    expect(mockRepo.getRevenueTrend).toHaveBeenCalledWith(
      "2017-01-01",
      "2018-01-01",
      "day",
      undefined
    );
    expect(result).toHaveLength(1);
  });

});