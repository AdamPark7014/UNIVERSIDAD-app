// Unidad de control (FSM) + ruta de datos del contador con signo de 9 bits.
// Rango: -256 a 255 en complemento a dos. El desbordamiento es modular:
//   255 + 1 -> -256   y   -256 - 1 -> 255
module signed_counter_fsm (
    input  wire              clk,
    input  wire              reset,        // activo en alto, maxima prioridad
    input  wire              tick,         // pulso de habilitacion de 1 ciclo
    input  wire              pause_pulse,  // prioridad 1
    input  wire              inc_pulse,    // prioridad 2
    input  wire              dec_pulse,    // prioridad 3
    output reg  signed [8:0] count,
    output reg         [1:0] state
);

    localparam [1:0] S_PAUSE = 2'd0;
    localparam [1:0] S_UP    = 2'd1;
    localparam [1:0] S_DOWN  = 2'd2;

    // Control: la prioridad es PAUSA > INCREMENTO > DECREMENTO
    always @(posedge clk) begin
        if (reset) begin
            state <= S_PAUSE;
            count <= 9'sd0;
        end else begin
            if (pause_pulse)
                state <= S_PAUSE;
            else if (inc_pulse)
                state <= S_UP;
            else if (dec_pulse)
                state <= S_DOWN;

            // Ruta de datos: solo cambia con tick y segun el estado actual
            if (tick) begin
                case (state)
                    S_UP:    count <= count + 9'sd1;   // 255 -> -256 (wrap)
                    S_DOWN:  count <= count - 9'sd1;   // -256 -> 255 (wrap)
                    default: count <= count;           // PAUSA: conserva el valor
                endcase
            end
        end
    end

endmodule
