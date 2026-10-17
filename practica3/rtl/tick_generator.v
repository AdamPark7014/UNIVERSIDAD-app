// Generador seleccionable de pulsos de habilitacion de un ciclo.
// speed_sel = 0 -> tick cada 1 s  (50 000 000 ciclos)
// speed_sel = 1 -> tick cada 100 ms (5 000 000 ciclos)
module tick_generator (
    input  wire clk,
    input  wire reset,
    input  wire enable,
    input  wire speed_sel,
    output reg  tick
);

    reg  [25:0] counter;
    wire [25:0] terminal_count = speed_sel ? 26'd4_999_999 : 26'd49_999_999;

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            counter <= 26'd0;
            tick    <= 1'b0;
        end else if (!enable) begin
            // En pausa el divisor se mantiene en cero
            counter <= 26'd0;
            tick    <= 1'b0;
        end else if (counter >= terminal_count) begin
            // >= evita quedarse esperando un valor ya rebasado al cambiar speed_sel
            counter <= 26'd0;
            tick    <= 1'b1;
        end else begin
            counter <= counter + 26'd1;
            tick    <= 1'b0;
        end
    end

endmodule
