export interface CategoriesRequest {
    stock_id?: number;
    [property: string]: any;
}
export interface CategoriesResponse {
    concepts: Concept[];
    industries: Industry[];
    [property: string]: any;
}

export interface Concept {
    concept_id: number;
    concept_name: string;
    [property: string]: any;
}

export interface Industry {
    industry_id?: number;
    industry_name?: string;
    [property: string]: any;
}
export interface ExecutiveRequest {
    id: number;
    page?: number;
    size?: number;
    [property: string]: any;
}
export interface ExecutiveResponse {
    executive_id: number;
    executive_name: string;
    position: string;
    salary: number;
    share_quantity: number;
    stock_id: number;
    [property: string]: any;
}
export interface ShareholdersRequest {
    id: number;
    page?: number;
    size?: number;
    [property: string]: any;
}
export interface ShareholdersResponse {
    proportion: number;
    share_quantity: number;
    shareholder_id: number;
    shareholder_name: string;
    stock_id: number;
    update_time: string;
    [property: string]: any;
}
export interface ExecutiveTransactionRequest {
    end_date?: string;
    start_date?: string;
    stock_id: number;
    [property: string]: any;
}
export interface ExecutiveTransactionResponse {
    after_change_quantity: number;
    change_date: string;
    change_id: number;
    change_quantity: number;
    change_type: string;
    executive_id: number;
    [property: string]: any;
}
export interface DividendsRequest {
    start_year?: number;
    stock_id: number;
    [property: string]: any;
}
export interface DividendsResponse {
    announcement_date: string;
    dividend_id: number;
    ex_dividend_date: string;
    payment_date: string;
    plan: string;
    stock_id: number;
    [property: string]: any;
}
export interface MarketOverviewRequest {
    type?: string;
    [property: string]: any;
}
export interface MarketOverviewResponse {
    change: number;
    change_rate: number;
    current_price: number;
    high_price: number;
    low_price: number;
    market_cap: number;
    open_price: number;
    stock_code: string;
    stock_id: number;
    stock_name: string;
    turnover: number | number;
    turnover_rate: number;
    volume: number;
    [property: string]: any;
}
export interface EventRequest {
    id: number;
    page?: number;
    size?: number;
    [property: string]: any;
}
export interface EventResponse {
    event_content: string;
    event_date: string;
    event_id: number;
    event_type: string;
    stock_id: number;
    [property: string]: any;
}
export interface StockBasicInfoRequest {
    id: number;
    [property: string]: any;
}
export interface StockBasicInfoResponse {
    eps: number;
    info_id: number;
    navps: number;
    pb_ratio: number;
    pe_ratio: number;
    shareholder_count: number;
    stock_code: string;
    stock_id: number;
    stock_name: string;
    total_shares: number;
    [property: string]: any;
}