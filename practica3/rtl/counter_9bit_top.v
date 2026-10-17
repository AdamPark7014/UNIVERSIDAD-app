// Modulo superior: contador ascendente-descendente de 9 bits con signo, DE10-Lite.
// Botones activos en bajo. SW0 selecciona la velocidad (0: 1 s, 1: 100 ms).
module counter_9bit_top (
    input  wire       CLOCK_50,
    input  wire       BTN_RESET_N,  // KEY0
    input  wire       BTN_PAUSE_N,  // KEY1
    input  wire       BTN_INC_N,    // GPIO
    input  wire       BTN_DEC_N,    // GPIO
    input  wire       SW_FREQ,      // SW0
    output wire [6:0] HEX0,
    output wire [6:0] HEX1,
    output wire [6:0] HEX2,
    output wire [6:0] HEX3,
    output wire [9:0] LEDR
);

    wire reset = ~BTN_RESET_N;

    wire        pause_pulse, inc_pulse, dec_pulse, tick;
    wire [1:0]  state;
    wire        running = (state != 2'd0);
    wire signed [8:0] count;

    // Sincronizador de dos FF para el selector de frecuencia
    reg speed_meta, speed_sync;
    always @(posedge CLOCK_50 or posedge reset) begin
        if (reset) begin
            speed_meta <= 1'b0;
            speed_sync <= 1'b0;
        end else begin
            speed_meta <= SW_FREQ;
            speed_sync <= speed_meta;
        end
    end

    button_onepulse u_pause (.clk(CLOCK_50), .reset(reset), .button_n(BTN_PAUSE_N), .press_pulse(pause_pulse));
    button_onepulse u_inc   (.clk(CLOCK_50), .reset(reset), .button_n(BTN_INC_N),   .press_pulse(inc_pulse));
    button_onepulse u_dec   (.clk(CLOCK_50), .reset(reset), .button_n(BTN_DEC_N),   .press_pulse(dec_pulse));

    tick_generator u_tick (
        .clk(CLOCK_50), .reset(reset), .enable(running),
        .speed_sel(speed_sync), .tick(tick)
    );

    signed_counter_fsm u_counter (
        .clk(CLOCK_50), .reset(reset), .tick(tick),
        .pause_pulse(pause_pulse), .inc_pulse(inc_pulse), .dec_pulse(dec_pulse),
        .count(count), .state(state)
    );

    signed_display_9bit u_display (
        .value(count), .HEX0(HEX0), .HEX1(HEX1), .HEX2(HEX2), .HEX3(HEX3)
    );

    // LEDR[0]: pausa, LEDR[1]: ascendente, LEDR[2]: descendente
    // LEDR[3]: 100 ms, LEDR[9]: numero negativo
    assign LEDR = {count[8], 5'b00000, speed_sync,
                   (state == 2'd2), (state == 2'd1), (state == 2'd0)};

endmodule
