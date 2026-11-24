package com.shopsphere.address;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.address.dto.AddressDtos.AddressRequest;
import com.shopsphere.auth.dto.AuthDtos.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AddressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String registerAndGetToken(String email) throws Exception {
        RegisterRequest req = new RegisterRequest("Test User", email, "Password123", "9876543210");
        MvcResult res = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    void customerCanManageOnlyOwnAddresses() throws Exception {
        String tokenA = registerAndGetToken("addr.a@shopsphere.local");
        String tokenB = registerAndGetToken("addr.b@shopsphere.local");

        AddressRequest addrReq1 = new AddressRequest(
                "User A", "9876543210", "12 MG Road", "Near Metro",
                "Bengaluru", "Karnataka", "560001", "India", "Home", false
        );

        MvcResult createdRes = mockMvc.perform(post("/api/v1/addresses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addrReq1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.defaultAddress").value(true))
                .andReturn();

        JsonNode created = objectMapper.readTree(createdRes.getResponse().getContentAsString());
        long addressId = created.path("data").path("id").asLong();

        // User B cannot delete User A's address
        mockMvc.perform(delete("/api/v1/addresses/" + addressId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        // User A creates second address and sets it default
        AddressRequest addrReq2 = new AddressRequest(
                "User A Office", "9876543211", "45 Indiranagar", null,
                "Bengaluru", "Karnataka", "560038", "India", "Work", false
        );
        MvcResult createdRes2 = mockMvc.perform(post("/api/v1/addresses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addrReq2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.defaultAddress").value(false))
                .andReturn();
        long addressId2 = objectMapper.readTree(createdRes2.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(patch("/api/v1/addresses/" + addressId2 + "/default")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultAddress").value(true));

        mockMvc.perform(get("/api/v1/addresses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(addressId2));
    }
}
