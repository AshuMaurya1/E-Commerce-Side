package com.shopsphere.payment;

import static org.junit.jupiter.api.Assertions.assertThrows;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.common.exception.ForbiddenException;
import com.shopsphere.config.AppProperties;
import org.junit.jupiter.api.Test;

class PaymentSimulationGuardTest {

    @Test
    void simulationIsDeniedByDefaultWhenNotExplicitlyEnabled() {
        AppProperties properties = new AppProperties();
        PaymentService service = new PaymentService(
                null,
                null,
                null,
                properties,
                new ObjectMapper()
        );

        assertThrows(ForbiddenException.class, () -> service.simulateTestSuccess(1L, "SS-ORDER-1"));
    }
}
