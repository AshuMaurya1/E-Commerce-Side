package com.shopsphere.address;

import com.shopsphere.address.dto.AddressDtos.AddressRequest;
import com.shopsphere.address.dto.AddressDtos.AddressResponse;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.user.User;
import com.shopsphere.user.UserService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserService userService;

    public AddressService(AddressRepository addressRepository, UserService userService) {
        this.addressRepository = addressRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> listUserAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(userId)
                .stream()
                .map(AddressResponse::from)
                .toList();
        }

    @Transactional(readOnly = true)
    public Address getOwnedAddress(Long userId, Long addressId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
    }

    @Transactional
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        User user = userService.getActiveUser(userId);
        boolean hasExisting = addressRepository.countByUserId(userId) > 0;
        boolean shouldBeDefault = request.defaultAddress() || !hasExisting;

        if (shouldBeDefault) {
            addressRepository.clearDefaultForUser(userId);
        }

        Address address = new Address();
        address.setUser(user);
        applyFields(address, request);
        address.setDefaultAddress(shouldBeDefault);

        return AddressResponse.from(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = getOwnedAddress(userId, addressId);
        if (request.defaultAddress() && !address.isDefaultAddress()) {
            addressRepository.clearDefaultForUser(userId);
            address.setDefaultAddress(true);
        }
        applyFields(address, request);
        return AddressResponse.from(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse setDefaultAddress(Long userId, Long addressId) {
        Address address = getOwnedAddress(userId, addressId);
        addressRepository.clearDefaultForUser(userId);
        address.setDefaultAddress(true);
        return AddressResponse.from(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = getOwnedAddress(userId, addressId);
        boolean wasDefault = address.isDefaultAddress();
        addressRepository.delete(address);

        if (wasDefault) {
            addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(userId)
                    .stream()
                    .findFirst()
                    .ifPresent(next -> {
                        next.setDefaultAddress(true);
                        addressRepository.save(next);
                    });
        }
    }

    private void applyFields(Address address, AddressRequest request) {
        address.setRecipientName(request.recipientName().trim());
        address.setPhone(request.phone().trim());
        address.setLine1(request.line1().trim());
        address.setLine2(request.line2() == null || request.line2().isBlank() ? null : request.line2().trim());
        address.setCity(request.city().trim());
        address.setState(request.state().trim());
        address.setPostalCode(request.postalCode().trim());
        address.setCountry(request.country() == null || request.country().isBlank() ? "India" : request.country().trim());
        address.setLabel(request.label() == null || request.label().isBlank() ? "Home" : request.label().trim());
    }
}
